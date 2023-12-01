import { initStorage, storage } from "../node-persist/storage.js";
const API_KEY = 'apiKey';
const getApiKey = async () => {
    const apiKey = storage.getItem(API_KEY) || undefined;
    return apiKey;
};
const setApiKey = async (apiKey) => {
    if (!storage) {
        initStorage();
    }
    storage.setItem(API_KEY, apiKey);
    console.info("API Key " + apiKey + " is set\n");
};
export { getApiKey, setApiKey };
//# sourceMappingURL=api-key-service.js.map