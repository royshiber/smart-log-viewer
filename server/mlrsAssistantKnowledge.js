/**
 * Why: Grounds the mLRS assistant on public olliw42 GitHub documentation without fetching at runtime.
 * What: Static reference text injected into the Gemini system prompt for /api/mlrs-chat.
 */
export const MLRS_ASSISTANT_KNOWLEDGE = `
## Official sources (GitHub)
- CLI commands & serial: github.com/olliw42/mLRS-docu/blob/master/docs/CLI.md
- All parameters (names, meanings, allowed values): github.com/olliw42/mLRS-docu/blob/master/docs/PARAMETERS.md
- Binding procedure: github.com/olliw42/mLRS-docu/blob/master/docs/BINDING.md
- ESP WiFi/BT transparent bridge (TCP default 5760, UDP 14550, AP IP often 192.168.4.55): github.com/olliw42/mLRS-docu/blob/master/docs/WIRELESS_BRIDGE.md — sketch: github.com/olliw42/mLRS/tree/main/esp/mlrs-wireless-bridge
- Matek mLRS modules (mR900/mR24, HC-04, USB-C DFU flashing): github.com/olliw42/mLRS-docu/blob/master/docs/MATEKSYS.md
- EdgeTX/OpenTX tool script (same logical actions as CLI): github.com/olliw42/mLRS/blob/master/lua/mLRS.lua
- Quick start (ArduPilot + Lua + GCS): github.com/olliw42/mLRS-docu/blob/master/docs/QUICK_START.md

## CLI rules (CLI.md)
- Serial: 115200 8N1. End each command with semicolon ; (also accept , or CR/LF but ; is recommended).
- List params: pl; (all), pl tx; (Tx only), pl rx; (Rx, needs link), pl c; (shared).
- Read one: p name; or p name = ?;
- Set: p name = value; — spaces in parameter names become underscore in CLI (e.g. Tx Power -> tx_power).
- Save to flash: pstore; (required after changes or lost on power cycle). Many params need power cycle to apply.
- Version/info: v;
- Help list: h;
- Bind: bind; on Tx; Rx needs bind button per BINDING.md.
- stats; streams statistics; send any byte to stop (often space).
- reload; reloads parameter values from flash.

## Typical user flow for changing a setting
1) Connect (handset Lua, OLED, or this desktop CLI).
2) pl tx; or pl rx; to see current names and allowed option indices/text.
3) p parameter_name = new_value;
4) pstore;
5) Power cycle if parameter docs say so.

## Wireless / GCS
- Bridge is transparent serial at module baud (often 115200). Mission Planner often uses TCP 5760 or UDP 14550 to the ESP AP.
- Only one TCP client may be accepted in some setups — disconnect Mission Planner before using another TCP tool on the same port.

## Matek notes (MATEKSYS.md)
- Firmware update: USB-C with bind button for DFU; mLRS Web Flasher at olliw.eu/mlrsflasher
- HC-04 Bluetooth: set Tx Ser Dest = serial; dip switches ON per doc.

## ArduPilot + RC without sticks (QUICK_START)
- Option: Rx Snd RcChannels = rc override (or mavlink RC) — then GCS can send RC; still configure mLRS params via CLI/Lua.

When answering: prefer Hebrew if the user wrote Hebrew. Give concrete CLI examples. If the user pastes log lines, interpret them literally. Never invent parameter names — if unknown, say to run pl tx; / pl rx; and check PARAMETERS.md.
`.trim();
