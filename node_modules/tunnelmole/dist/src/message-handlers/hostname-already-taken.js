export default async function hostnameAlreadyTaken(message) {
    console.error(message.hostname + " is already taken, please choose a different hostname");
    process.exit(0);
}
//# sourceMappingURL=hostname-already-taken.js.map