import HostipWebSocket from "../websocket/host-ip-websocket.js";
import ForwardedRequestMessage from "../messages/forwarded-request-message.js";
import { Options } from "../options.js";
export default function forwardedRequest(forwardedRequestMessage: ForwardedRequestMessage, websocket: HostipWebSocket, options: Options): Promise<void>;
