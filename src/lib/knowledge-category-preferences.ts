export interface KnowledgeCategoryPreferenceState {
  pinnedCategoryIds: string[];
  recentCategoryIds: string[];
}

const STORAGE_KEY = "student_app_knowledge_category_prefs_v1";
const MAX_PINNED = 8;
const MAX_RECENT = 8;

const DEFAULT_STATE: KnowledgeCategoryPreferenceState = {
  pinnedCategoryIds: [],
  recentCategoryIds: [],
};

function uniqueIds(ids: string[]): string[] {
  return ids.filter((id, index, list) => id && list.indexOf(id) === index);
}

function normalize(state: KnowledgeCategoryPreferenceState): KnowledgeCategoryPreferenceState {
  return {
    pinnedCategoryIds: uniqueIds(state.pinnedCategoryIds).slice(0, MAX_PINNED),
    recentCategoryIds: uniqueIds(state.recentCategoryIds).slice(0, MAX_RECENT),
  };
}

export function loadKnowledgeCategoryPreferences(): KnowledgeCategoryPreferenceState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<KnowledgeCategoryPreferenceState>;
    return normalize({
      pinnedCategoryIds: parsed.pinnedCategoryIds ?? [],
      recentCategoryIds: parsed.recentCategoryIds ?? [],
    });
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveKnowledgeCategoryPreferences(state: KnowledgeCategoryPreferenceState): KnowledgeCategoryPreferenceState {
  const normalized = normalize(state);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function markRecentKnowledgeCategory(categoryId: string): KnowledgeCategoryPreferenceState {
  const current = loadKnowledgeCategoryPreferences();
  const nextRecent = [categoryId, ...current.recentCategoryIds.filter((id) => id !== categoryId)];
  return saveKnowledgeCategoryPreferences({
    ...current,
    recentCategoryIds: nextRecent,
  });
}

export function togglePinnedKnowledgeCategory(categoryId: string): KnowledgeCategoryPreferenceState {
  const current = loadKnowledgeCategoryPreferences();
  const pinned = current.pinnedCategoryIds.includes(categoryId)
    ? current.pinnedCategoryIds.filter((id) => id !== categoryId)
    : [categoryId, ...current.pinnedCategoryIds];

  return saveKnowledgeCategoryPreferences({
    ...current,
    pinnedCategoryIds: pinned,
  });
}
