/**
 * Why: Browsers cannot open raw TCP to the mLRS WiFi bridge; this process forwards bytes.
 * What: Listens on a local WebSocket; each browser client gets a TCP socket to the Tx bridge
 * (defaults from olliw42/mLRS wireless-bridge docs: IP 192.168.4.55, port 5760, serial 115200).
 */
import net from 'node:net';
import { WebSocketServer } from 'ws';

const TCP_HOST = process.env.MLRS_TCP_HOST || '192.168.4.55';
const TCP_PORT = Number(process.env.MLRS_TCP_PORT || 5760);
const WS_PORT = Number(process.env.MLRS_WS_PORT || 13765);

const wss = new WebSocketServer({ port: WS_PORT });
// eslint-disable-next-line no-console
console.log(
  `[mLRS bridge] WS ws://127.0.0.1:${WS_PORT}  <->  tcp://${TCP_HOST}:${TCP_PORT} (set MLRS_TCP_HOST / MLRS_TCP_PORT to override)`,
);

wss.on('connection', (ws) => {
  const sock = net.connect({ host: TCP_HOST, port: TCP_PORT });
  sock.setNoDelay(true);

  sock.on('data', (buf) => {
    if (ws.readyState === 1) ws.send(buf);
  });
  sock.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[mLRS bridge] TCP error:', err.message);
    ws.close();
  });
  sock.on('close', () => {
    ws.close();
  });

  ws.on('message', (data, isBinary) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (sock.writable) sock.write(buf);
  });
  ws.on('close', () => {
    sock.destroy();
  });
  ws.on('error', () => {
    sock.destroy();
  });
});
