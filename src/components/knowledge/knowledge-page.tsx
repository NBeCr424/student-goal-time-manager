"use client";

import { useEffect, useMemo, useState } from "react";
import { CourseLearningView } from "@/components/knowledge/course-learning-view";
import { KnowledgeCategoryManager } from "@/components/knowledge/knowledge-category-manager";
import { knowledgeItemTypeOptions, learningStatusLabel } from "@/components/knowledge/knowledge-constants";
import { KnowledgeCourseTree } from "@/components/knowledge/knowledge-course-tree";
import { KnowledgeEditor } from "@/components/knowledge/knowledge-editor";
import { PdfPanel } from "@/components/knowledge/pdf-panel";
import { QuickNotePanel } from "@/components/knowledge/quick-note-panel";
import { KnowledgeItem } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type KnowledgeTab = "all" | "tree" | "categories" | "quick_notes" | "pdf" | "summaries" | "recent";

const tabs: Array<{ id: KnowledgeTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "tree", label: "Course Tree" },
  { id: "categories", label: "Categories" },
  { id: "quick_notes", label: "Quick Notes" },
  { id: "pdf", label: "PDF Docs" },
  { id: "summaries", label: "Summaries" },
  { id: "recent", label: "Recent" },
];

const summaryTypes = new Set(["topic_summary", "chapter_summary", "pdf_summary"]);

function containsKeyword(item: KnowledgeItem, keyword: string): boolean {
  if (!keyword) {
    return true;
  }

  const source = `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase();
  return source.includes(keyword.toLowerCase());
}

export function KnowledgePage() {
  const { state, actions } = useAppStore();

  const [activeTab, setActiveTab] = useState<KnowledgeTab>("tree");
  const [keyword, setKeyword] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(state.knowledgeCourses[0]?.id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [creatingItem, setCreatingItem] = useState(false);

  useEffect(() => {
    if (!selectedCourseId && state.knowledgeCourses.length > 0) {
      setSelectedCourseId(state.knowledgeCourses[0].id);
    }
  }, [selectedCourseId, state.knowledgeCourses]);

  const itemTypeLabel = useMemo(
    () => Object.fromEntries(knowledgeItemTypeOptions.map((option) => [option.value, option.label])),
    [],
  );

  const categoryMap = useMemo(
    () => new Map(state.knowledgeCategories.map((category) => [category.id, category])),
    [state.knowledgeCategories],
  );
  const subjectMap = useMemo(
    () => new Map(state.knowledgeSubjects.map((subject) => [subject.id, subject])),
    [state.knowledgeSubjects],
  );
  const courseMap = useMemo(
    () => new Map(state.knowledgeCourses.map((course) => [course.id, course])),
    [state.knowledgeCourses],
  );
  const nodeMap = useMemo(
    () => new Map(state.knowledgeNodes.map((node) => [node.id, node])),
    [state.knowledgeNodes],
  );

  const itemCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    state.knowledgeItems.forEach((item) => {
      if (item.categoryId) {
        map[item.categoryId] = (map[item.categoryId] ?? 0) + 1;
      }
    });
    return map;
  }, [state.knowledgeItems]);

  const itemCountByCourse = useMemo(() => {
    const map: Record<string, number> = {};
    state.knowledgeItems.forEach((item) => {
      if (item.courseId) {
        map[item.courseId] = (map[item.courseId] ?? 0) + 1;
      }
    });
    return map;
  }, [state.knowledgeItems]);

  const itemCountByNode = useMemo(() => {
    const map: Record<string, number> = {};
    state.knowledgeItems.forEach((item) => {
      if (item.nodeId) {
        map[item.nodeId] = (map[item.nodeId] ?? 0) + 1;
      }
    });
    return map;
  }, [state.knowledgeItems]);

  const searchedItems = useMemo(
    () => state.knowledgeItems.filter((item) => containsKeyword(item, keyword)),
    [keyword, state.knowledgeItems],
  );

  const categoryFilteredItems = useMemo(
    () =>
      searchedItems.filter((item) => {
        if (!selectedCategoryId) {
          return true;
        }
        return item.categoryId === selectedCategoryId;
      }),
    [searchedItems, selectedCategoryId],
  );

  const summaryItems = useMemo(() => searchedItems.filter((item) => summaryTypes.has(item.type)), [searchedItems]);

  const recentItems = useMemo(
    () =>
      searchedItems
        .slice()
        .sort((a, b) => `${b.updatedAt}-${b.createdAt}`.localeCompare(`${a.updatedAt}-${a.createdAt}`)),
    [searchedItems],
  );

  const selectedItem =
    state.knowledgeItems.find((item) => item.id === selectedItemId) ?? categoryFilteredItems[0] ?? searchedItems[0];
  const editingItem = state.knowledgeItems.find((item) => item.id === editingItemId) ?? undefined;

  const courseNodeOptions = useMemo(
    () => state.knowledgeNodes.filter((node) => !selectedCourseId || node.courseId === selectedCourseId),
    [selectedCourseId, state.knowledgeNodes],
  );

  function startCreateItem() {
    setCreatingItem(true);
    setEditingItemId(null);
  }

  function startEditItem(itemId: string) {
    setCreatingItem(false);
    setEditingItemId(itemId);
  }

  function closeEditor() {
    setCreatingItem(false);
    setEditingItemId(null);
  }

  function removeItem(itemId: string) {
    actions.deleteKnowledgeItem(itemId);
    if (selectedItemId === itemId) {
      setSelectedItemId(undefined);
    }
    if (editingItemId === itemId) {
      closeEditor();
    }
  }

  function renderItemList(items: KnowledgeItem[], emptyText: string) {
    return (
      <div className="grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="card-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Knowledge Items</h3>
            <span className="text-xs text-ink/60">{items.length}</span>
          </div>

          <ul className="mt-2 space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    selectedItem?.id === item.id ? "border-ink bg-ink/5" : "border-ink/10 bg-white"
                  }`}
                >
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-ink/60">
                    {itemTypeLabel[item.type]} · {item.updatedAt}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {items.length === 0 && <p className="mt-3 text-sm text-ink/60">{emptyText}</p>}
        </article>

        <article className="card-surface p-4 md:p-5">
          {!selectedItem && <p className="text-sm text-ink/60">Select an item to inspect details.</p>}

          {selectedItem && (
            <>
              <p className="soft-label">{itemTypeLabel[selectedItem.type]}</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">{selectedItem.title}</h3>
              <p className="mt-3 rounded-xl bg-white p-3 text-sm text-ink/85 whitespace-pre-wrap">{selectedItem.content}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedItem.tags.map((tag) => (
                  <span key={tag} className="badge border-ink/15 bg-paper text-ink/70">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink/70">
                <p>Category: {selectedItem.categoryId ? categoryMap.get(selectedItem.categoryId)?.name || "Unknown" : "N/A"}</p>
                <p>Subject: {selectedItem.subjectId ? subjectMap.get(selectedItem.subjectId)?.name || "Unknown" : "N/A"}</p>
                <p>Course: {selectedItem.courseId ? courseMap.get(selectedItem.courseId)?.name || "Unknown" : "N/A"}</p>
                <p>Node: {selectedItem.nodeId ? nodeMap.get(selectedItem.nodeId)?.title || "Unknown" : "N/A"}</p>
              </div>

              <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">Related Tasks</p>
                <ul className="mt-2 space-y-1 text-sm text-ink/80">
                  {selectedItem.relatedTaskIds.map((taskId) => {
                    const task = state.tasks.find((entry) => entry.id === taskId);
                    return <li key={taskId}>- {task?.title ?? taskId}</li>;
                  })}
                </ul>
                {selectedItem.relatedTaskIds.length === 0 && <p className="mt-1 text-sm text-ink/55">No linked tasks.</p>}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditItem(selectedItem.id)}
                  className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(selectedItem.id)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <h2 className="section-title">Knowledge Map</h2>
        <p className="mt-1 text-sm text-ink/70">
          Learn by path: Subject &gt; Course &gt; Chapter/Topic/Summary &gt; Content.
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_120px_120px_120px_120px]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search content, tags, keywords"
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
          <button type="button" onClick={startCreateItem} className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-white">
            New Item
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pdf")}
            className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          >
            Upload PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quick_notes")}
            className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          >
            Quick Note
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          >
            Categories
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <select
            value={selectedCourseId ?? ""}
            onChange={(event) => {
              setSelectedCourseId(event.target.value || undefined);
              setSelectedNodeId(undefined);
            }}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">Select course</option>
            {state.knowledgeCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} · {learningStatusLabel[course.status]}
              </option>
            ))}
          </select>
          <select
            value={selectedNodeId ?? ""}
            onChange={(event) => setSelectedNodeId(event.target.value || undefined)}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">Select chapter/topic/summary</option>
            {courseNodeOptions.map((node) => (
              <option key={node.id} value={node.id}>
                {node.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
                activeTab === tab.id ? "bg-ink text-white" : "bg-white text-ink/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-3">
          <section className="card-surface p-3">
            <h3 className="text-sm font-semibold text-ink">Course Tree</h3>
            <div className="mt-2 max-h-[70vh] overflow-auto pr-1">
              <KnowledgeCourseTree
                subjects={state.knowledgeSubjects}
                courses={state.knowledgeCourses}
                nodes={state.knowledgeNodes}
                selectedCourseId={selectedCourseId}
                selectedNodeId={selectedNodeId}
                itemCountByCourse={itemCountByCourse}
                itemCountByNode={itemCountByNode}
                onSelectCourse={(courseId) => {
                  setSelectedCourseId(courseId);
                  setSelectedNodeId(undefined);
                }}
                onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
              />
            </div>
          </section>

          <section className="card-surface p-3">
            <h3 className="text-sm font-semibold text-ink">Category Snapshot</h3>
            <ul className="mt-2 space-y-1 text-xs text-ink/70">
              {state.knowledgeCategories
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <li key={category.id}>
                    {category.parentId ? "- " : ""}
                    {category.name} ({itemCountByCategory[category.id] ?? 0})
                  </li>
                ))}
            </ul>
          </section>
        </aside>

        <section className="space-y-4">
          {(creatingItem || editingItem) && (
            <KnowledgeEditor
              categories={state.knowledgeCategories}
              subjects={state.knowledgeSubjects}
              courses={state.knowledgeCourses}
              nodes={state.knowledgeNodes}
              tasks={state.tasks}
              initialItem={editingItem}
              defaultCourseId={selectedCourseId}
              defaultNodeId={selectedNodeId}
              onSave={(input) => {
                if (editingItem) {
                  actions.updateKnowledgeItem(editingItem.id, input);
                } else {
                  actions.addKnowledgeItem(input);
                }
                closeEditor();
              }}
              onCancel={closeEditor}
            />
          )}

          {!creatingItem && !editingItem && activeTab === "all" &&
            renderItemList(categoryFilteredItems, "No knowledge items yet.")}

          {!creatingItem && !editingItem && activeTab === "tree" && (
            <CourseLearningView
              selectedCourseId={selectedCourseId}
              selectedNodeId={selectedNodeId}
              courses={state.knowledgeCourses}
              nodes={state.knowledgeNodes}
              items={searchedItems}
              quickNotes={state.quickNotes}
              pdfDocuments={state.pdfDocuments}
              tasks={state.tasks}
              onUpdateCourseStatus={actions.updateCourseLearningStatus}
              onUpdateNodeStatus={actions.updateNodeLearningStatus}
            />
          )}

          {!creatingItem && !editingItem && activeTab === "categories" && (
            <div className="space-y-3">
              <KnowledgeCategoryManager
                categories={state.knowledgeCategories}
                itemCountByCategory={itemCountByCategory}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onAddCategory={actions.addKnowledgeCategory}
                onUpdateCategory={actions.updateKnowledgeCategory}
                onDeleteCategory={actions.deleteKnowledgeCategory}
                onReorderCategory={actions.reorderKnowledgeCategory}
              />
              {renderItemList(categoryFilteredItems, "No items under this category.")}
            </div>
          )}

          {!creatingItem && !editingItem && activeTab === "quick_notes" && (
            <QuickNotePanel
              quickNotes={state.quickNotes}
              categories={state.knowledgeCategories}
              subjects={state.knowledgeSubjects}
              courses={state.knowledgeCourses}
              nodes={state.knowledgeNodes}
              onAdd={actions.addQuickNote}
              onUpdate={actions.updateQuickNote}
              onDelete={actions.deleteQuickNote}
              onImport={actions.importQuickNoteToKnowledge}
            />
          )}

          {!creatingItem && !editingItem && activeTab === "pdf" && (
            <PdfPanel
              documents={state.pdfDocuments}
              categories={state.knowledgeCategories}
              subjects={state.knowledgeSubjects}
              courses={state.knowledgeCourses}
              nodes={state.knowledgeNodes}
              onUpload={actions.uploadPdfDocument}
              onSaveSummary={actions.savePdfSummaryToKnowledge}
            />
          )}

          {!creatingItem && !editingItem && activeTab === "summaries" && (
            <div className="space-y-3">
              {renderItemList(summaryItems, "No summary content yet.")}
              <article className="card-surface p-4">
                <h3 className="section-title">Export Hooks (MVP Placeholder)</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-ink/75">
                  <li>Export chapter notes</li>
                  <li>Export topic summaries</li>
                  <li>Export PDF summaries</li>
                  <li>Export all quick notes</li>
                  <li>Aggregate one-page summary by node</li>
                </ul>
              </article>
            </div>
          )}

          {!creatingItem && !editingItem && activeTab === "recent" && renderItemList(recentItems, "No recent updates.")}
        </section>
      </div>
    </div>
  );
}
