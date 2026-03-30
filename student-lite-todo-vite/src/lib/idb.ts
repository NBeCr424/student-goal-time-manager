import { ActiveFocus, FocusSession, Goal, Todo } from "../types";

const DB_NAME = "student_lite_todo_v1";
const DB_VERSION = 1;

const STORE_GOALS = "goals";
const STORE_TODOS = "todos";
const STORE_FOCUS = "focusSessions";
const STORE_META = "meta";

interface MetaRecord<T> {
  key: string;
  value: T;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_GOALS)) {
        db.createObjectStore(STORE_GOALS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_TODOS)) {
        db.createObjectStore(STORE_TODOS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_FOCUS)) {
        db.createObjectStore(STORE_FOCUS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);

  try {
    const result = await handler(store);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    });
    return result;
  } finally {
    db.close();
  }
}

async function readAll<T>(storeName: string): Promise<T[]> {
  return withStore(storeName, "readonly", async (store) => requestToPromise(store.getAll() as IDBRequest<T[]>));
}

async function putValue<T>(storeName: string, value: T): Promise<void> {
  await withStore(storeName, "readwrite", async (store) => {
    await requestToPromise(store.put(value));
  });
}

async function putMany<T>(storeName: string, values: T[]): Promise<void> {
  if (values.length === 0) {
    return;
  }

  await withStore(storeName, "readwrite", async (store) => {
    for (const value of values) {
      await requestToPromise(store.put(value));
    }
  });
}

async function deleteValue(storeName: string, key: string): Promise<void> {
  await withStore(storeName, "readwrite", async (store) => {
    await requestToPromise(store.delete(key));
  });
}

async function getMeta<T>(key: string): Promise<T | null> {
  return withStore(STORE_META, "readonly", async (store) => {
    const record = await requestToPromise(store.get(key) as IDBRequest<MetaRecord<T> | undefined>);
    return record?.value ?? null;
  });
}

async function setMeta<T>(key: string, value: T | null): Promise<void> {
  await withStore(STORE_META, "readwrite", async (store) => {
    if (value === null) {
      await requestToPromise(store.delete(key));
      return;
    }
    await requestToPromise(store.put({ key, value } as MetaRecord<T>));
  });
}

export async function loadAllData(): Promise<{
  goals: Goal[];
  todos: Todo[];
  focusSessions: FocusSession[];
  activeFocus: ActiveFocus | null;
}> {
  const [goals, todos, focusSessions, activeFocus] = await Promise.all([
    readAll<Goal>(STORE_GOALS),
    readAll<Todo>(STORE_TODOS),
    readAll<FocusSession>(STORE_FOCUS),
    getMeta<ActiveFocus>("activeFocus"),
  ]);

  return {
    goals: goals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    todos: todos.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    focusSessions: focusSessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    activeFocus,
  };
}

export const idb = {
  putGoal: (goal: Goal) => putValue(STORE_GOALS, goal),
  putTodo: (todo: Todo) => putValue(STORE_TODOS, todo),
  putTodos: (todos: Todo[]) => putMany(STORE_TODOS, todos),
  putFocusSession: (session: FocusSession) => putValue(STORE_FOCUS, session),
  deleteGoal: (id: string) => deleteValue(STORE_GOALS, id),
  deleteTodo: (id: string) => deleteValue(STORE_TODOS, id),
  setActiveFocus: (focus: ActiveFocus | null) => setMeta("activeFocus", focus),
};
