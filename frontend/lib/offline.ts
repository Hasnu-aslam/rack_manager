// IndexedDB utilities for offline storage

const DB_NAME = "rack_manager_db";
const DB_VERSION = 1;

interface OfflineAction {
  id: string;
  type: "create_product" | "update_product" | "create_sale" | "update_stock";
  payload: any;
  timestamp: number;
  synced: 0 | 1;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains("products")) {
          const productsStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
          productsStore.createIndex("sku", "sku", { unique: true });
        }

        // Sales store
        if (!db.objectStoreNames.contains("sales")) {
          db.createObjectStore("sales", { keyPath: "id", autoIncrement: true });
        }

        // Offline actions queue
        if (!db.objectStoreNames.contains("offline_actions")) {
          const actionsStore = db.createObjectStore("offline_actions", { keyPath: "id", autoIncrement: true });
          actionsStore.createIndex("synced", "synced", { unique: false });
          actionsStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  // Products
  async saveProduct(product: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["products"], "readwrite");
      const store = transaction.objectStore("products");
      const request = store.put(product);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["products"], "readonly");
      const store = transaction.objectStore("products");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getProduct(id: number): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["products"], "readonly");
      const store = transaction.objectStore("products");
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Offline actions queue
  async queueAction(action: Omit<OfflineAction, "id" | "synced">): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offline_actions"], "readwrite");
      const store = transaction.objectStore("offline_actions");
      const request = store.add({
        ...action,
        id: Date.now().toString(),
        synced: 0,
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offline_actions"], "readonly");
      const store = transaction.objectStore("offline_actions");
      const index = store.index("synced");
      const request = index.getAll(0);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async markActionSynced(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["offline_actions"], "readwrite");
      const store = transaction.objectStore("offline_actions");
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.synced = 1;
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

// Background sync
export async function syncOfflineActions() {
  if (!navigator.onLine) return;

  try {
    const actions = await offlineStorage.getPendingActions();
    const { apiClient } = await import("./api");

    for (const action of actions) {
      try {
        switch (action.type) {
          case "create_product":
            await apiClient.createProduct(action.payload);
            break;
          case "update_product":
            await apiClient.updateProduct(action.payload.id, action.payload);
            break;
          case "create_sale":
            await apiClient.createSale(action.payload);
            break;
          case "update_stock":
            await apiClient.updateStock(
              action.payload.product_id,
              action.payload.quantity,
              action.payload.reason
            );
            break;
        }
        await offlineStorage.markActionSynced(action.id);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to sync offline actions:", error);
  }
}

// Listen for online event
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOfflineActions();
  });
}
