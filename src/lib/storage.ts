import { AppState } from "@/lib/types";

const STORAGE_KEY = "student_goal_time_manager_v2";
const GUEST_CACHE_KEY = "student_goal_time_manager_guest_cache_v2";

export function loadState(): AppState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadGuestCache(): AppState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(GUEST_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function saveGuestCache(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GUEST_CACHE_KEY, JSON.stringify(state));
}

export function clearGuestCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(GUEST_CACHE_KEY);
}
