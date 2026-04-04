#!/usr/bin/env python3
"""
RPi Companion MAVLink -> App UDP telemetry bridge.

Reads MAVLink from ArduPilot and forwards concise JSON events to the app backend
UDP bridge endpoint (TELEMETRY_UDP_PORT).
"""

import json
import os
import socket
import time
from pymavlink import mavutil


MAVLINK_IN = os.getenv("MAVLINK_IN", "udp:127.0.0.1:14550")
APP_UDP_HOST = os.getenv("APP_UDP_HOST", "127.0.0.1")
APP_UDP_PORT = int(os.getenv("APP_UDP_PORT", "14560"))
SEND_HZ = float(os.getenv("SEND_HZ", "5.0"))


def build_event(msg):
    """Why: normalize many MAVLink message types into stable UI events.
    What: convert one MAVLink message into a small JSON object for telemetry UI."""
    mtype = msg.get_type()
    payload = msg.to_dict()
    if mtype == "HEARTBEAT":
        return {
            "type": "fc",
            "level": "info",
            "text": "FC heartbeat received",
            "data": {
                "base_mode": payload.get("base_mode"),
                "custom_mode": payload.get("custom_mode"),
                "system_status": payload.get("system_status"),
            },
        }
    if mtype == "GLOBAL_POSITION_INT":
        return {
            "type": "position",
            "level": "info",
            "text": "Position update",
            "data": {
                "lat": payload.get("lat", 0) / 1e7,
                "lon": payload.get("lon", 0) / 1e7,
                "alt_m": payload.get("relative_alt", 0) / 1000.0,
                "heading_deg": payload.get("hdg", 0) / 100.0,
            },
        }
    if mtype == "ATTITUDE":
        return {
            "type": "attitude",
            "level": "info",
            "text": "Attitude update",
            "data": {
                "roll_rad": payload.get("roll"),
                "pitch_rad": payload.get("pitch"),
                "yaw_rad": payload.get("yaw"),
            },
        }
    if mtype == "STATUSTEXT":
        sev = payload.get("severity", 6)
        level = "error" if sev <= 3 else "warn" if sev <= 5 else "info"
        return {
            "type": "messages",
            "level": level,
            "text": payload.get("text", "").strip() or "STATUSTEXT",
            "data": {"severity": sev},
        }
    return None


def main():
    print(f"[bridge] MAVLINK_IN={MAVLINK_IN} -> {APP_UDP_HOST}:{APP_UDP_PORT} @ {SEND_HZ}Hz")
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    master = mavutil.mavlink_connection(MAVLINK_IN, autoreconnect=True)
    last_send = 0.0

    while True:
        msg = master.recv_match(blocking=True, timeout=1.0)
        if msg is None:
            continue
        event = build_event(msg)
        if not event:
            continue
        now = time.time()
        if now - last_send < (1.0 / max(SEND_HZ, 0.1)):
            continue
        last_send = now
        raw = json.dumps(event, ensure_ascii=True).encode("utf-8")
        sock.sendto(raw, (APP_UDP_HOST, APP_UDP_PORT))


if __name__ == "__main__":
    main()
