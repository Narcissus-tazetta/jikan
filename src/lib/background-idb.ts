const DB_NAME = "zikan";
const DB_VERSION = 1;
const STORE_NAME = "background-assets";

const openDb = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB is not available"));
            return;
        }

        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
    });
};

const withStore = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const db = await openDb();

    return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);

        const req = fn(store);

        let hasResult = false;
        let result: T;

        req.onsuccess = () => {
            hasResult = true;
            result = req.result;
        };
        req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));

        tx.oncomplete = () => {
            db.close();
            resolve(hasResult ? result : (undefined as unknown as T));
        };
        tx.onabort = () => {
            reject(tx.error ?? new Error("IndexedDB transaction aborted"));
            db.close();
        };
        tx.onerror = () => {
            reject(tx.error ?? new Error("IndexedDB transaction failed"));
            db.close();
        };
    });
};

export const putBackgroundBlob = async (key: string, blob: Blob): Promise<void> => {
    await withStore("readwrite", (store) => store.put(blob, key));
};

export const getBackgroundBlob = async (key: string): Promise<Blob | null> => {
    const res = await withStore<Blob | undefined>("readonly", (store) => store.get(key));
    return res ?? null;
};

export const deleteBackgroundBlob = async (key: string): Promise<void> => {
    await withStore("readwrite", (store) => store.delete(key));
};
