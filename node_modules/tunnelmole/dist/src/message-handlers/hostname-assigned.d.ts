import HostnameAssignedMessage from '../messages/hostname-assigned-message.js';
import HostipWebSocket from '../websocket/host-ip-websocket.js';
import { Options } from '../options.js';
export default function hostnameAssigned(message: HostnameAssignedMessage, websocket: HostipWebSocket, options: Options): Promise<void>;
