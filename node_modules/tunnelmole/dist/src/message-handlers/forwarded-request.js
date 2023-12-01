import http from 'http';
import { forwardedResponse } from "../messages/types.js";
import log from "../logging/log.js";
export default async function forwardedRequest(forwardedRequestMessage, websocket, options) {
    const port = options.port;
    const { requestId, url, headers } = forwardedRequestMessage;
    // @todo: Once GET is working, add support for all HTTP methods
    const requestOptions = {
        hostname: 'localhost',
        method: forwardedRequestMessage.method,
        port: port,
        path: url,
        headers
    };
    const request = http.request(requestOptions, (response) => {
        let responseBody;
        response.on('data', (chunk) => {
            if (typeof responseBody === 'undefined') {
                responseBody = chunk;
            }
            else {
                responseBody = Buffer.concat([responseBody, chunk]);
            }
        });
        /**
         * If you see this callback being called more than once, this is probably normal especially if a browser initiated the request
         * Most browsers will make more than one request, for example an extra one for favicon.ico
         */
        response.on('end', () => {
            //@ts-ignore
            const forwardedResponseMessage = {
                type: forwardedResponse,
                requestId,
                statusCode: response.statusCode,
                url,
                headers: response.headers,
                body: ''
            };
            if (Buffer.isBuffer(responseBody)) {
                forwardedResponseMessage.body = responseBody.toString('base64');
            }
            websocket.sendMessage(forwardedResponseMessage);
        });
    });
    // Send the request body if its not empty
    if (forwardedRequestMessage.body !== '') {
        const requestBody = Buffer.from(forwardedRequestMessage.body, 'base64');
        request.write(requestBody);
    }
    request.on('error', (error) => {
        log(error);
    });
    request.end();
}
//# sourceMappingURL=forwarded-request.js.map