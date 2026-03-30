"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KnowledgeEditor } from "@/components/knowledge/knowledge-editor";
import { knowledgeItemTypeOptions } from "@/components/knowledge/knowledge-constants";
import { KnowledgeItem } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function containsKeyword(item: KnowledgeItem, keyword: string): boolean {
  if (!keyword) {
    return true;
  }
  const source = `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase();
  return source.includes(keyword.toLowerCase());
}

function sourceTypeLabel(sourceType?: KnowledgeItem["sourceType"]): string {
  if (sourceType === "today_note") {
    return "今日速记";
  }
  if (sourceType === "outside_knowledge") {
    return "长期积累";
  }
  return "知识条目";
}

export function KnowledgeItemsPage() {
  const { state, actions } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [creating, setCreating] = useState(searchParams.get("action") === "create");

  const taskIdFilter = searchParams.get("taskId") ?? "";
  const itemTypeLabel = useMemo(
    () => Object.fromEntries(knowledgeItemTypeOptions.map((option) => [option.value, option.label])),
    [],
  );

  useEffect(() => {
    setKeyword(searchParams.get("q") ?? "");
    if (searchParams.get("action") === "create") {
      setCreating(true);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return state.knowledgeItems
      .filter((item) => containsKeyword(item, keyword))
      .filter((item) => !selectedCourseId || item.courseId === selectedCourseId)
      .filter((item) => !selectedCategoryId || item.categoryId === selectedCategoryId)
      .filter((item) => !taskIdFilter || item.relatedTaskIds.includes(taskIdFilter))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [keyword, selectedCourseId, selectedCategoryId, state.knowledgeItems, taskIdFilter]);

  const taskFilterTitle = taskIdFilter ? state.tasks.find((task) => task.id === taskIdFilter)?.title : undefined;

  function applySearch() {
    const params = new URLSearchParams(searchParams.toString());
    if (keyword.trim()) {
      params.set("q", keyword.trim());
    } else {
      params.delete("q");
    }
    params.delete("action");
    router.replace(`/knowledge/items${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function clearTaskFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("taskId");
    router.replace(`/knowledge/items${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">知识条目</h2>
            <p className="mt-1 text-sm text-ink/65">列表与详情分离，手机端先看列表再看详情。</p>
          </div>
          <button
            type="button"
            onClick={() => setCreating((prev) => !prev)}
            className="rounded-xl bg-ink px-3 py-2 text-sm text-white"
          >
            {creating ? "关闭新建" : "新建知识"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applySearch();
              }
            }}
            placeholder="搜索标题、正文、标签"
            className="min-w-0 flex-1 rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
          <button type="button" onClick={applySearch} className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm">
            筛选
          </button>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <select
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">全部课程</option>
            {state.knowledgeCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">全部分类</option>
            {state.knowledgeCategories
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parentId ? "- " : ""}
                  {category.name}
                </option>
              ))}
          </select>
        </div>

        {taskIdFilter && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-mint/40 bg-mint/10 px-3 py-2 text-xs text-ink/75">
            <span>仅看任务关联资料：{taskFilterTitle || taskIdFilter}</span>
            <button type="button" onClick={clearTaskFilter} className="rounded-full border border-ink/15 bg-white px-2 py-0.5">
              清除
            </button>
          </div>
        )}
      </section>

      {creating && (
        <KnowledgeEditor
          categories={state.knowledgeCategories}
          subjects={state.knowledgeSubjects}
          courses={state.knowledgeCourses}
          nodes={state.knowledgeNodes}
          tasks={state.tasks}
          onSave={(input) => {
            actions.addKnowledgeItem(input);
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      <section className="card-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink/60">共 {filtered.length} 条</p>
          <Link href="/knowledge/settings/categories" className="text-xs text-ink/65 underline">
            分类管理
          </Link>
        </div>

        <ul className="mt-3 space-y-2">
          {filtered.map((item) => {
            const category = item.categoryId
              ? state.knowledgeCategories.find((entry) => entry.id === item.categoryId)?.name
              : undefined;
            const course = item.courseId
              ? state.knowledgeCourses.find((entry) => entry.id === item.courseId)?.name
              : undefined;

            return (
              <li key={item.id}>
                <Link href={`/knowledge/items/${item.id}`} className="block rounded-xl border border-ink/10 bg-white p-3">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    {itemTypeLabel[item.type]} · {sourceTypeLabel(item.sourceType)} · 更新于 {item.updatedAt}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-ink/55">
                    {category && <span className="badge border-ink/15 bg-paper text-ink/70">{category}</span>}
                    {course && <span className="badge border-ink/15 bg-white text-ink/70">{course}</span>}
                    {(item.attachments?.length ?? 0) > 0 && (
                      <span className="badge border-ink/15 bg-white text-ink/70">附件 {item.attachments?.length}</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && <p className="mt-3 text-sm text-ink/60">暂无匹配结果。</p>}
      </section>
    </div>
  );
}
