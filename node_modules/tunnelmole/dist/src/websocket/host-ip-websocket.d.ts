import WebSocket from 'ws';
export default class HostipWebSocket extends WebSocket {
    sendMessage(object: unknown): void;
}
