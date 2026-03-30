"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { KnowledgeAttachment, KnowledgeSourceType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

interface KnowledgeSourceEntryPageProps {
  sourceType: KnowledgeSourceType;
  title: string;
  description: string;
  showTags: boolean;
}

function parseTags(input: string): string[] {
  return input
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function trimToSummary(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (clean.length <= 70) {
    return clean;
  }
  return `${clean.slice(0, 70)}...`;
}

const MOCK_SPEECH_SNIPPETS = [
  "极限定义要先看自变量趋近，再判断函数值趋势。",
  "这题关键是先列已知条件，再选最短证明路径。",
  "阅读题先抓主题句，细节题回到原文定位。",
  "实验报告先写变量控制，再写误差来源。",
];

export function KnowledgeSourceEntryPage({ sourceType, title, description, showTags }: KnowledgeSourceEntryPageProps) {
  const { state, actions } = useAppStore();
  const [openSheet, setOpenSheet] = useState(false);
  const [openCategoryManager, setOpenCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [pendingDeleteCategoryId, setPendingDeleteCategoryId] = useState<string | null>(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftDate, setDraftDate] = useState(todayKey());
  const [draftContent, setDraftContent] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [imageAttachments, setImageAttachments] = useState<KnowledgeAttachment[]>([]);
  const [fileAttachments, setFileAttachments] = useState<KnowledgeAttachment[]>([]);
  const [hint, setHint] = useState("");
  const [isMockListening, setIsMockListening] = useState(false);
  const mockTimerRef = useRef<number | null>(null);

  const sortedCategories = useMemo(
    () => [...state.knowledgeCategories].sort((a, b) => a.order - b.order),
    [state.knowledgeCategories],
  );
  const categoryItemCount = useMemo(() => {
    const map: Record<string, number> = {};
    state.knowledgeItems.forEach((item) => {
      if (item.categoryId) {
        map[item.categoryId] = (map[item.categoryId] ?? 0) + 1;
      }
    });
    return map;
  }, [state.knowledgeItems]);
  const pendingDeleteCategory = useMemo(
    () => sortedCategories.find((category) => category.id === pendingDeleteCategoryId) ?? null,
    [pendingDeleteCategoryId, sortedCategories],
  );

  const itemList = useMemo(
    () =>
      state.knowledgeItems
        .filter((item) => (item.sourceType ?? "outside_knowledge") === sourceType)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [sourceType, state.knowledgeItems],
  );

  function toAttachments(files: FileList | null, fallbackType: "image" | "document"): KnowledgeAttachment[] {
    if (!files || files.length === 0) {
      return [];
    }
    return Array.from(files).map((file) => {
      const fileType = file.type || fallbackType;
      return {
        id: createId("attach"),
        name: file.name,
        fileType,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
      };
    });
  }

  function handleImageFiles(event: ChangeEvent<HTMLInputElement>) {
    setImageAttachments(toAttachments(event.target.files, "image"));
  }

  function handleDocFiles(event: ChangeEvent<HTMLInputElement>) {
    setFileAttachments(toAttachments(event.target.files, "document"));
  }

  function resetDraft() {
    setDraftTitle("");
    setDraftDate(todayKey());
    setDraftContent("");
    setDraftCategoryId("");
    setDraftTags("");
    setImageAttachments([]);
    setFileAttachments([]);
    setIsMockListening(false);
    setOpenCategoryManager(false);
    setNewCategoryName("");
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setPendingDeleteCategoryId(null);
    if (mockTimerRef.current) {
      window.clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (!draftCategoryId) {
      return;
    }
    if (!state.knowledgeCategories.some((category) => category.id === draftCategoryId)) {
      setDraftCategoryId("");
    }
  }, [draftCategoryId, state.knowledgeCategories]);

  useEffect(() => {
    return () => {
      if (mockTimerRef.current) {
        window.clearTimeout(mockTimerRef.current);
        mockTimerRef.current = null;
      }
    };
  }, []);

  function runMockSpeechToText() {
    if (isMockListening) {
      return;
    }

    setIsMockListening(true);
    setHint("正在语音转文字（Mock）...");

    mockTimerRef.current = window.setTimeout(() => {
      const sentence = MOCK_SPEECH_SNIPPETS[Math.floor(Math.random() * MOCK_SPEECH_SNIPPETS.length)];
      setDraftContent((prev) => (prev.trim() ? `${prev.trim()}\n${sentence}` : sentence));
      setIsMockListening(false);
      setHint("已插入语音转写内容（Mock）。");
      mockTimerRef.current = null;
    }, 1100);
  }

  function stopMockSpeechToText() {
    if (!isMockListening) {
      return;
    }

    if (mockTimerRef.current) {
      window.clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }
    setIsMockListening(false);
    setHint("已停止语音输入。");
  }

  function saveItem() {
    const cleanTitle = draftTitle.trim();
    const cleanContent = draftContent.trim();
    if (!cleanTitle || !cleanContent) {
      setHint("请先填写标题和内容。");
      return;
    }

    const attachments = [...imageAttachments, ...fileAttachments];
    const tags = showTags ? parseTags(draftTags) : [];

    actions.addKnowledgeItem({
      title: cleanTitle,
      type: sourceType === "today_note" ? "quick_note_import" : "note",
      sourceType,
      tags,
      content: `[记录时间：${draftDate}]\n${cleanContent}`,
      attachments,
      images: imageAttachments.map((item) => item.name),
      fileType: attachments.length > 0 ? attachments[0].fileType : undefined,
      categoryId: draftCategoryId || "cat_uncategorized",
      relatedTaskIds: [],
    });

    resetDraft();
    closeDraftSheet();
    setHint("已保存到知识库。");
  }

  function closeDraftSheet() {
    setOpenSheet(false);
    setOpenCategoryManager(false);
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setPendingDeleteCategoryId(null);
  }

  function addCategoryFromManager() {
    const clean = newCategoryName.trim();
    if (!clean) {
      return;
    }
    actions.addKnowledgeCategory(clean);
    setNewCategoryName("");
    setHint(`已新建分类：${clean}`);
  }

  function startEditCategory(categoryId: string, categoryName: string) {
    const target = sortedCategories.find((category) => category.id === categoryId);
    if (!target || target.isSystem) {
      return;
    }
    setEditingCategoryId(categoryId);
    setEditingCategoryName(categoryName);
  }

  function saveEditingCategory() {
    if (!editingCategoryId) {
      return;
    }
    const clean = editingCategoryName.trim();
    if (!clean) {
      return;
    }
    actions.updateKnowledgeCategory(editingCategoryId, clean);
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setHint("分类名称已更新。");
  }

  function requestDeleteCategory(categoryId: string) {
    setPendingDeleteCategoryId(categoryId);
  }

  function confirmDeleteCategory() {
    if (!pendingDeleteCategory) {
      return;
    }
    actions.deleteKnowledgeCategory(pendingDeleteCategory.id);
    setPendingDeleteCategoryId(null);
    setEditingCategoryId((prev) => (prev === pendingDeleteCategory.id ? null : prev));
    setEditingCategoryName("");
    setHint(`已删除分类：${pendingDeleteCategory.name}，原有知识已转为未分类。`);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">{title}</h2>
            <p className="mt-1 text-sm text-ink/65">{description}</p>
          </div>
          <button type="button" onClick={() => setOpenSheet(true)} className="rounded-xl bg-ink px-3 py-2 text-sm text-white">
            新建
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href="/knowledge" className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-ink/70">
            返回知识库
          </Link>
          <Link href="/knowledge/categories" className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-ink/70">
            分类文件夹
          </Link>
        </div>
      </section>

      <section className="card-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">最近录入</h3>
          <p className="text-xs text-ink/60">共 {itemList.length} 条</p>
        </div>

        <ul className="mt-3 space-y-2">
          {itemList.slice(0, 12).map((item) => {
            const categoryName = item.categoryId
              ? state.knowledgeCategories.find((category) => category.id === item.categoryId)?.name
              : undefined;
            return (
              <li key={item.id}>
                <Link href={`/knowledge/items/${item.id}`} className="block rounded-xl border border-ink/10 bg-white p-3">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-ink/60">{trimToSummary(item.content)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink/60">
                    <span className="badge border-ink/15 bg-paper text-ink/70">{item.updatedAt}</span>
                    {categoryName && <span className="badge border-ink/15 bg-white text-ink/70">{categoryName}</span>}
                    {(item.attachments?.length ?? 0) > 0 && (
                      <span className="badge border-ink/15 bg-white text-ink/70">附件 {item.attachments?.length}</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {itemList.length === 0 && <p className="mt-2 text-sm text-ink/60">还没有内容，先新建一条。</p>}
      </section>

      {hint && <p className="text-center text-xs text-ink/65">{hint}</p>}

      {openSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <button type="button" onClick={closeDraftSheet} className="absolute inset-0 bg-black/35" />
          <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
            <h4 className="text-base font-semibold text-ink">{title} · 新建</h4>

            <div className="mt-3 space-y-2">
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="标题"
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              />

              <input
                type="date"
                value={draftDate}
                onChange={(event) => setDraftDate(event.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              />

              <textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                placeholder="记录知识内容"
                rows={4}
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              />

              {sourceType === "today_note" && (
                <div className="rounded-xl border border-ink/10 bg-white p-3">
                  <p className="text-xs text-ink/60">语音转文字（Mock）</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={runMockSpeechToText}
                      disabled={isMockListening}
                      className="rounded-xl border border-ink/15 bg-paper px-3 py-1.5 text-xs text-ink/75 disabled:opacity-60"
                    >
                      {isMockListening ? "识别中..." : "开始语音输入"}
                    </button>
                    {isMockListening && (
                      <button
                        type="button"
                        onClick={stopMockSpeechToText}
                        className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/75"
                      >
                        停止
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-ink/55">当前为 Mock 模式，后续可接真实语音识别接口。</p>
                </div>
              )}

              <div className="space-y-2 rounded-xl border border-ink/10 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-ink/60">所属分类</p>
                  <button
                    type="button"
                    onClick={() => setOpenCategoryManager(true)}
                    className="rounded-full border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/75"
                  >
                    管理分类
                  </button>
                </div>
                <select
                  value={draftCategoryId}
                  onChange={(event) => setDraftCategoryId(event.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
                >
                  <option value="">未分类</option>
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.parentId ? "- " : ""}
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {showTags && (
                <input
                  value={draftTags}
                  onChange={(event) => setDraftTags(event.target.value)}
                  placeholder="标签（空格或逗号分隔，可选）"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
                />
              )}

              <div className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">图片（可选）</p>
                <input type="file" accept="image/*" multiple onChange={handleImageFiles} className="mt-1 w-full text-xs text-ink/70" />
              </div>

              <div className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">PDF / Word（可选）</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  multiple
                  onChange={handleDocFiles}
                  className="mt-1 w-full text-xs text-ink/70"
                />
              </div>
            </div>

            <button type="button" onClick={saveItem} className="mt-4 w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
              保存
            </button>
          </section>

          {openCategoryManager && (
            <div className="fixed inset-0 z-[60] flex items-end">
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryManager(false);
                  setEditingCategoryId(null);
                  setEditingCategoryName("");
                  setPendingDeleteCategoryId(null);
                }}
                className="absolute inset-0 bg-black/35"
              />
              <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-ink">管理分类</h4>
                  <button
                    type="button"
                    onClick={() => setOpenCategoryManager(false)}
                    className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70"
                  >
                    完成
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="输入分类名称"
                    className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addCategoryFromManager}
                    className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-white"
                  >
                    新建
                  </button>
                </div>

                <ul className="mt-3 max-h-[46vh] space-y-2 overflow-y-auto pr-1">
                  {sortedCategories.map((category) => {
                    const editing = editingCategoryId === category.id;
                    return (
                      <li key={category.id} className="rounded-xl border border-ink/10 bg-white p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {editing ? (
                              <input
                                value={editingCategoryName}
                                onChange={(event) => setEditingCategoryName(event.target.value)}
                                className="w-full rounded-lg border border-ink/15 px-2 py-1.5 text-sm"
                              />
                            ) : (
                              <p className="truncate text-sm text-ink">
                                {category.parentId ? "└ " : ""}
                                {category.name}
                                {category.isSystem && <span className="ml-1 text-[11px] text-sky-600">系统</span>}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-ink/55">
                              知识条目 {categoryItemCount[category.id] ?? 0} 条
                            </p>
                          </div>

                          <div className="flex shrink-0 gap-1">
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={saveEditingCategory}
                                  className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-[11px] text-ink/75"
                                >
                                  保存
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryId(null);
                                    setEditingCategoryName("");
                                  }}
                                  className="rounded-lg border border-ink/15 bg-white px-2 py-1 text-[11px] text-ink/65"
                                >
                                  取消
                                </button>
                              </>
                            ) : (
                              !category.isSystem && (
                                <button
                                  type="button"
                                  onClick={() => startEditCategory(category.id, category.name)}
                                  className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-[11px] text-ink/75"
                                >
                                  编辑
                                </button>
                              )
                            )}

                            {!category.isSystem && !editing && (
                              <button
                                type="button"
                                onClick={() => requestDeleteCategory(category.id)}
                                className="rounded-lg border border-red-200 bg-white px-2 py-1 text-[11px] text-red-700"
                              >
                                删除
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {sortedCategories.length === 0 && <p className="mt-3 text-sm text-ink/60">还没有分类，先新建一个。</p>}
              </section>
            </div>
          )}

          {pendingDeleteCategory && (
            <div className="fixed inset-0 z-[70] flex items-end">
              <button type="button" onClick={() => setPendingDeleteCategoryId(null)} className="absolute inset-0 bg-black/35" />
              <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
                <h4 className="text-base font-semibold text-ink">确认删除分类</h4>
                <p className="mt-2 text-sm text-ink/80">
                  确认删除“{pendingDeleteCategory.name}”吗？删除后，该分类下的知识内容将变为未分类。
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteCategoryId(null)}
                    className="flex-1 rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteCategory}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    删除
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
