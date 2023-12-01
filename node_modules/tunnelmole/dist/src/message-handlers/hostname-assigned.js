import { eventHandler, URL_ASSIGNED } from '../events/event-handler.js';
export default async function hostnameAssigned(message, websocket, options) {
    const port = options.port;
    if (typeof port === 'undefined') {
        console.error('Please specify a port e.g. run "tmole 80"');
    }
    const httpUrl = `http://${message.hostname}`;
    const httpsUrl = `https://${message.hostname}`;
    if (process.env.TUNNELMOLE_QUIET_MODE !== '1') {
        console.info(`${httpUrl} is forwarding to localhost:${port}`);
        console.info(`${httpsUrl} is forwarding to localhost:${port}`);
    }
    eventHandler.emit(URL_ASSIGNED, httpsUrl);
}
//# sourceMappingURL=hostname-assigned.js.map