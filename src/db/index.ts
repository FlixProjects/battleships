export const OBJECT_STORE_NAME = "jwkKeys";
export class FrontendDB {
    private db: IDBDatabase;
    private connection?: Promise<IDBDatabase>;

    async start(onSuccess?: (db: FrontendDB) => Promise<void>): Promise<this> {
        await this.open();
        if (onSuccess) {
            await onSuccess(this);
        }
        return this;
    }

    async open(): Promise<IDBDatabase> {
        if (this.connection) {
            return this.connection;
        }
        this.connection = new Promise((resolve, reject) => {
            const request = window.indexedDB.open("battleships-keys", 4);
            request.onupgradeneeded = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.createObjectStore();
            };
            request.onsuccess = (event) => resolve(request.result);
            request.onerror = (event) => reject(new Error("Failed to open IndexedDB."));
        });
        return this.connection;
    }

    getDB(): IDBDatabase {
        return this.db;
    }

    createObjectStore() {
        if (this.db) {
            if (this.db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
                return;
            }

            this.db.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
        }
    }

    async get(keyId: string): Promise<{ value: CryptoKey | undefined }> {
        const db = await this.open();
        const txn = db.transaction(OBJECT_STORE_NAME, "readonly");
        return await this.promisifyRequest(txn.objectStore(OBJECT_STORE_NAME).get(keyId));
    }

    async store(value: any, keyId: string) {
        const db = await this.open();
        const txn = db.transaction(OBJECT_STORE_NAME, "readwrite");
        txn.objectStore(OBJECT_STORE_NAME).put({ id: keyId, value });
        return await this.promisifyTransaction(txn);
    }

    private promisifyTransaction(tx: IDBTransaction): Promise<void> {
        return new Promise((resolve, reject) => {
            tx.addEventListener("complete", () => resolve());
            tx.addEventListener("error", () => reject(tx.error));
            tx.addEventListener("abort", () => reject(tx.error ?? new Error("Transaction aborted")));
        });
    }

    private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => resolve(request.result));
            request.addEventListener("error", () => reject(request.error));
        });
    }
}
