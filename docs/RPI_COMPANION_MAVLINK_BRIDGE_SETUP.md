# RPi Companion MAVLink Bridge Setup

## Goal

Run a Python bridge on Raspberry Pi to read MAVLink and forward normalized events to the app telemetry UDP endpoint.

## Files

- `scripts/rpi_companion/mavlink_udp_bridge.py`
- `scripts/rpi_companion/requirements.txt`

## Install on Raspberry Pi

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/rpi_companion/requirements.txt
```

## Environment

```bash
export MAVLINK_IN=udp:127.0.0.1:14550
export APP_UDP_HOST=192.168.1.50
export APP_UDP_PORT=14560
export SEND_HZ=5
```

## Run

```bash
python scripts/rpi_companion/mavlink_udp_bridge.py
```

## Expected UI Result

In Telemetry tab:

- UDP bridge shows enabled and healthy.
- Packet counter increases.
- Events appear for FC heartbeat, position, attitude, and status text.
