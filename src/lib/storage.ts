/* ---------------------------------------------------------
   Local storage helpers
--------------------------------------------------------- */
declare global {
  interface Window {
    storage?: {
      get: (key: string, parse?: boolean) => Promise<{ value: string } | null>;
      set: (key: string, value: string, stringify?: boolean) => Promise<void>;
      delete: (key: string, parse?: boolean) => Promise<void>;
      list: (prefix: string, parse?: boolean) => Promise<{ keys: string[] } | null>;
    };
  }
}

/* IndexedDB 기반 저장소 (localStorage 5MB 한도 때문에 이전) */
const DB_NAME = "wardrobe-archive";
const DB_STORE = "kv";
const MIGRATION_FLAG = "meta:migrated_from_localstorage";
const LEGACY_PREFIXES = ["item:", "brand:", "material:", "reference:", "sale:", "meta:"];
export const STORAGE_ERROR_EVENT = "wardrobe:storage-error";

function reportStorageError(action: string, key: string, e: unknown) {
  console.error(`storage ${action} failed`, key, e);
  window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { action, key } }));
}

function prefixRange(prefix: string): IDBKeyRange {
  return IDBKeyRange.bound(prefix, prefix + "\uffff");
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbTxDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new DOMException("Transaction aborted", "AbortError"));
  });
}

/** 기존 localStorage 데이터를 IndexedDB로 한 번만 복사 (원본은 삭제하지 않음) */
async function migrateFromLocalStorage(db: IDBDatabase): Promise<void> {
  const flag = await idbRequest(db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(MIGRATION_FLAG));
  if (flag === "true") return;

  const entries: [string, string][] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !LEGACY_PREFIXES.some((p) => key.startsWith(p))) continue;
      const value = localStorage.getItem(key);
      if (value !== null) entries.push([key, value]);
    }
  } catch (e) {
    console.error("legacy storage read failed", e);
  }

  const tx = db.transaction(DB_STORE, "readwrite");
  const done = idbTxDone(tx);
  try {
    const store = tx.objectStore(DB_STORE);
    for (const [key, value] of entries) store.put(value, key);
    store.put("true", MIGRATION_FLAG);
  } catch (e) {
    // 중간에 예외가 나면 일부만 커밋되지 않도록 트랜잭션 전체를 취소
    try { tx.abort(); } catch { /* 이미 종료됨 */ }
    await done.catch(() => {});
    throw e;
  }
  await done;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("IndexedDB blocked"));
    }).then(async (db) => {
      await migrateFromLocalStorage(db);
      // 브라우저가 저장 공간 부족 시 데이터를 임의로 지우지 않도록 요청 (실패해도 무시)
      void navigator.storage?.persist?.().catch(() => {});
      return db;
    });
  }
  return dbPromise;
}

export async function storeGet(key: string): Promise<string | null> {
  try {
    const db = await getDb();
    const v = await idbRequest(db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(key));
    return typeof v === "string" ? v : null;
  } catch (e) {
    reportStorageError("get", key, e);
    return null;
  }
}

export async function storeSet(key: string, value: string): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, key);
    await idbTxDone(tx);
  } catch (e) {
    reportStorageError("set", key, e);
  }
}

export async function storeDelete(key: string): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(key);
    await idbTxDone(tx);
  } catch (e) {
    reportStorageError("delete", key, e);
  }
}

export async function storeListLoad<T>(prefix: string): Promise<T[]> {
  try {
    const db = await getDb();
    const values = await idbRequest(
      db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).getAll(prefixRange(prefix))
    );
    const result: T[] = [];
    for (const value of values) {
      if (typeof value !== "string" || !value) continue;
      try {
        result.push(JSON.parse(value) as T);
      } catch {
        // 손상된 데이터는 건너뜀
      }
    }
    return result;
  } catch (e) {
    reportStorageError("list", prefix, e);
    return [];
  }
}

/** 가져오기용: 지정한 접두사의 기존 데이터를 지우고 새 데이터를 한 트랜잭션으로 기록 (실패 시 기존 데이터 유지) */
export async function storeReplacePrefixes(prefixes: string[], entries: [string, string][]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(DB_STORE, "readwrite");
  const done = idbTxDone(tx);
  try {
    const store = tx.objectStore(DB_STORE);
    for (const p of prefixes) store.delete(prefixRange(p));
    for (const [key, value] of entries) store.put(value, key);
  } catch (e) {
    // 삭제만 반영되고 새 데이터가 빠지는 일이 없도록 전체 취소
    try { tx.abort(); } catch { /* 이미 종료됨 */ }
    await done.catch(() => {});
    throw e;
  }
  await done;
}
