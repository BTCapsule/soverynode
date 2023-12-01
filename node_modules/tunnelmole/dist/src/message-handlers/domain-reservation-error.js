export default function domainReservationError(message) {
    console.info(`There was an error reserving the domain ${message.subdomain}.tunnelmole.net. Falling back to a random subdomain`);
}
export { domainReservationError };
//# sourceMappingURL=domain-reservation-error.js.map