import WebSocket from 'ws';
export default class HostipWebSocket extends WebSocket {
    sendMessage(object) {
        const json = JSON.stringify(object);
        this.send(json);
    }
}
//# sourceMappingURL=host-ip-websocket.js.map