declare const getApiKey: () => Promise<string | undefined>;
declare const setApiKey: (apiKey: string) => Promise<void>;
export { getApiKey, setApiKey };
