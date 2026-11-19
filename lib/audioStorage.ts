/**
 * Suara peringatan bisa berukuran beberapa megabyte, jadi Blob disimpan di
 * IndexedDB — bukan localStorage yang hanya menerima string dan berbatas ~5 MB.
 * Semua fungsi di sini hanya dipanggil dari event/effect di sisi klien, sehingga
 * tidak ada akses `indexedDB` saat render server.
 */
const DB_NAME = "chronostage.audio";
const DB_VERSION = 1;
const STORE_NAME = "alert-sounds";

interface StoredAlertSound {
  id: string;
  name: string;
  type: string;
  blob: Blob;
}

export interface AlertSoundMeta {
  id: string;
  name: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB tidak tersedia di browser ini."));
  }
  if (!dbPromise) {
    const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>();
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Gagal membuka IndexedDB."));
    request.onblocked = () =>
      reject(new Error("IndexedDB diblokir tab lain yang masih terbuka."));

    dbPromise = promise.catch((error: unknown) => {
      // Jangan cache kegagalan: percobaan berikutnya harus membuka ulang.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

function runRequest<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then((db) => {
    const { promise, resolve, reject } = Promise.withResolvers<T>();
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Operasi IndexedDB gagal."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Transaksi IndexedDB dibatalkan."));

    return promise;
  });
}

export async function saveAlertSound(id: string, file: Blob): Promise<void> {
  const name =
    typeof File !== "undefined" && file instanceof File
      ? file.name
      : `${id}.wav`;
  const record: StoredAlertSound = { id, name, type: file.type, blob: file };
  await runRequest<IDBValidKey>("readwrite", (store) => store.put(record));
}

export async function loadAlertSound(id: string): Promise<Blob | null> {
  const record = await runRequest<StoredAlertSound | undefined>(
    "readonly",
    (store) => store.get(id) as IDBRequest<StoredAlertSound | undefined>,
  );
  return record?.blob ?? null;
}

export async function deleteAlertSound(id: string): Promise<void> {
  await runRequest<undefined>("readwrite", (store) =>
    store.delete(id) as IDBRequest<undefined>,
  );
}

/** Hanya kunci dan nama file: Blob besar tidak ikut dibaca ke memori. */
export async function listAlertSounds(): Promise<AlertSoundMeta[]> {
  const db = await openDatabase();
  const { promise, resolve, reject } = Promise.withResolvers<AlertSoundMeta[]>();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).openCursor();
  const items: AlertSoundMeta[] = [];

  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) {
      resolve(items);
      return;
    }
    const value = cursor.value as StoredAlertSound;
    items.push({ id: String(cursor.key), name: value.name || "File kustom" });
    cursor.continue();
  };
  request.onerror = () =>
    reject(request.error ?? new Error("Gagal membaca daftar suara."));

  return promise;
}
