import hostnameAssigned from "./src/message-handlers/hostname-assigned.js";
import forwardedRequest from "./src/message-handlers/forwarded-request.js";
import hostnameAlreadyTaken from "./src/message-handlers/hostname-already-taken.js";
import invalidSubscription from "./src/message-handlers/invalid-subscription.js";
import domainAlreadyReserved from "./src/message-handlers/domain-already-reserved.js";
import domainReservationError from "./src/message-handlers/domain-reservation-error.js";
import tooManyDomains from "./src/message-handlers/too-many-domains.js";
import clientMessage from "./src/message-handlers/client-message.js";
/**
 * Websocket message handlers for different message types
 * Like app.ts for express, but with handlers for different message types instead of URLs
 */
declare const messageHandlers: {
    hostnameAssigned: typeof hostnameAssigned;
    forwardedRequest: typeof forwardedRequest;
    hostnameAlreadyTaken: typeof hostnameAlreadyTaken;
    invalidSubscription: typeof invalidSubscription;
    domainAlreadyReserved: typeof domainAlreadyReserved;
    domainReservationError: typeof domainReservationError;
    tooManyDomains: typeof tooManyDomains;
    clientMessage: typeof clientMessage;
};
export { messageHandlers };
