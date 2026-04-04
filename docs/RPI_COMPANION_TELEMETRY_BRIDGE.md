# RPi Companion Telemetry Bridge

## Goal

Send live events from `Raspberry Pi 5` companion logic into the app telemetry tab.

## Server Side

- Set in `server/.env`:
  - `TELEMETRY_UDP_PORT=14560`
  - `TELEMETRY_UDP_HOST=0.0.0.0`
- Start backend.
- UI telemetry tab will show UDP bridge health and packet counters.

## Packet Format (UDP JSON)

Send one JSON object per UDP datagram:

```json
{
  "type": "vision",
  "level": "info",
  "text": "Lateral offset update",
  "data": { "lateralOffsetM": 1.2, "headingErrorDeg": -3.8, "confidence": 0.91 }
}
```

## Python Sender Example (RPi)

```python
import json
import socket
import time

DEST = ("192.168.1.50", 14560)  # replace with backend host
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

while True:
    payload = {
        "type": "vision",
        "level": "info",
        "text": "Vision tracking sample",
        "data": {
            "lateralOffsetM": 0.8,
            "headingErrorDeg": -2.1,
            "confidence": 0.87,
        },
    }
    sock.sendto(json.dumps(payload).encode("utf-8"), DEST)
    time.sleep(0.2)
```

## Notes

- Non-JSON packets are accepted but marked as parse warnings in the telemetry stream.
- Keep packet rate moderate (5-10Hz) for initial tests.
