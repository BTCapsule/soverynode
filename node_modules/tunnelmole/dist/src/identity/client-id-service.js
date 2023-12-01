import { nanoid } from 'nanoid';
import { storage } from '../node-persist/storage.js';
const initialiseClientId = async () => {
    // @todo Check for an existing client id before overwriting it with a new one
    const existingClientId = await getClientId();
    if (!existingClientId) {
        const clientId = nanoid();
        storage.setItem('clientId', clientId);
    }
};
const getClientId = async () => {
    const clientId = storage.getItem('clientId');
    return clientId;
};
export { initialiseClientId, getClientId };
//# sourceMappingURL=client-id-service.js.map