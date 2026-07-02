import type { UserProfile } from "../types/permissions";

const STORAGE_KEY = "hsjmaais.auth.v1";
const memoryStorage = new Map<string, string>();

export interface StoredAuthState {
  accessToken: string | null;
  expiresAt: number | null;
  user: UserProfile | null;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = window.localStorage;
  if (
    storage &&
    typeof storage.getItem === "function" &&
    typeof storage.setItem === "function" &&
    typeof storage.removeItem === "function"
  ) {
    return storage;
  }

  const fallbackStorage: Storage = {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    clear: () => {
      memoryStorage.clear();
    },
    key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
    get length() {
      return memoryStorage.size;
    },
  } as Storage;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: fallbackStorage,
  });

  return fallbackStorage;
}

export function persistAuthState(state: StoredAuthState) {
  const storage = getStorage();
  if (!storage) {
    console.log("[authPersistence] storage indisponível para persistir sessão");
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  console.log("[authPersistence] sessão guardada", {
    hasToken: Boolean(state.accessToken),
    expiresAt: state.expiresAt,
    user: state.user?.email ?? null,
  });
}

export function loadStoredAuth(): StoredAuthState | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(STORAGE_KEY);

  if (!rawValue) {
    console.log("[authPersistence] nenhuma sessão guardada no storage");
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredAuthState;

    if (parsed.expiresAt && parsed.expiresAt * 1000 <= Date.now()) {
      console.log("[authPersistence] sessão expirada, a limpar storage");
      clearStoredAuth();
      return null;
    }

    console.log("[authPersistence] sessão restaurada do storage", {
      hasToken: Boolean(parsed.accessToken),
      expiresAt: parsed.expiresAt,
      user: parsed.user?.email ?? null,
    });
    return parsed;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function clearStoredAuth() {
  const storage = getStorage();
  if (!storage) {
    console.log("[authPersistence] storage indisponível para limpar sessão");
    return;
  }

  storage.removeItem(STORAGE_KEY);
  console.log("[authPersistence] sessão limpa do storage");
}
