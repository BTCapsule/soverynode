export default function tooManyDomains(message) {
    console.info(`You have exceeded the domain limit for your API key. Falling back to a random subdomain. Try removing some domains with "tmole --unreserve-subdomain <subdomain>"`);
}
export { tooManyDomains };
//# sourceMappingURL=too-many-domains.js.map