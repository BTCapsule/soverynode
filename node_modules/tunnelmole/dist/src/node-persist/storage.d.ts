import { LocalStorage } from 'node-localstorage';
declare let storage: LocalStorage;
declare const initStorage: () => Promise<void>;
export { initStorage, storage };
