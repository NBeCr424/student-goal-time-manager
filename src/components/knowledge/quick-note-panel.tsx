"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  KnowledgeCategory,
  KnowledgeCourse,
  KnowledgeNode,
  KnowledgeSubject,
  QuickNote,
  QuickNoteInput,
} from "@/lib/types";
import { parseTags, toTagsInput } from "@/components/knowledge/knowledge-constants";

interface QuickNotePanelProps {
  quickNotes: QuickNote[];
  categories: KnowledgeCategory[];
  subjects: KnowledgeSubject[];
  courses: KnowledgeCourse[];
  nodes: KnowledgeNode[];
  onAdd: (input: QuickNoteInput) => void;
  onUpdate: (noteId: string, input: QuickNoteInput) => void;
  onDelete: (noteId: string) => void;
  onImport: (noteId: string) => void;
}

interface QuickNoteDraft {
  title?: string;
  content: string;
  tagsInput: string;
  categoryId: string;
  subjectId: string;
  courseId: string;
  nodeId: string;
}

const initialDraft: QuickNoteDraft = {
  title: "",
  content: "",
  tagsInput: "",
  categoryId: "",
  subjectId: "",
  courseId: "",
  nodeId: "",
};

function toInput(draft: QuickNoteDraft): QuickNoteInput {
  return {
    title: draft.title?.trim() || undefined,
    content: draft.content,
    tags: parseTags(draft.tagsInput),
    categoryId: draft.categoryId || undefined,
    subjectId: draft.subjectId || undefined,
    courseId: draft.courseId || undefined,
    nodeId: draft.nodeId || undefined,
  };
}

export function QuickNotePanel({
  quickNotes,
  categories,
  subjects,
  courses,
  nodes,
  onAdd,
  onUpdate,
  onDelete,
  onImport,
}: QuickNotePanelProps) {
  const [draft, setDraft] = useState<QuickNoteDraft>(initialDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedCategories = useMemo(() => categories.slice().sort((a, b) => a.order - b.order), [categories]);

  const editDraft = useMemo(() => {
    if (!editingId) {
      return null;
    }
    const target = quickNotes.find((note) => note.id === editingId);
    if (!target) {
      return null;
    }
    return {
      title: target.title ?? "",
      content: target.content,
      tagsInput: toTagsInput(target.tags),
      categoryId: target.categoryId ?? "",
      subjectId: target.subjectId ?? "",
      courseId: target.courseId ?? "",
      nodeId: target.nodeId ?? "",
    } satisfies QuickNoteDraft;
  }, [editingId, quickNotes]);

  const [editingDraft, setEditingDraft] = useState<QuickNoteDraft | null>(null);

  function startEdit(noteId: string) {
    const target = quickNotes.find((note) => note.id === noteId);
    if (!target) {
      return;
    }

    setEditingId(noteId);
    setEditingDraft({
      title: target.title ?? "",
      content: target.content,
      tagsInput: toTagsInput(target.tags),
      categoryId: target.categoryId ?? "",
      subjectId: target.subjectId ?? "",
      courseId: target.courseId ?? "",
      nodeId: target.nodeId ?? "",
    });
  }

  function submitNew(event: FormEvent) {
    event.preventDefault();
    if (!draft.content.trim()) {
      return;
    }
    onAdd(toInput(draft));
    setDraft(initialDraft);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submitNew} className="rounded-xl border border-ink/10 bg-white p-3">
        <h4 className="text-sm font-semibold text-ink">新建速记</h4>
        <p className="mt-1 text-xs text-ink/55">速记可先独立存在，后续一键导入知识库。</p>

        <input
          value={draft.title}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="可选标题"
          className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />

        <textarea
          value={draft.content}
          onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
          rows={4}
          placeholder="速记内容"
          className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          required
        />

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input
            value={draft.tagsInput}
            onChange={(event) => setDraft((prev) => ({ ...prev, tagsInput: event.target.value }))}
            placeholder="标签，逗号分隔"
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />

          <select
            value={draft.categoryId}
            onChange={(event) => setDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">无分类</option>
            {sortedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? "- " : ""}
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <select
            value={draft.subjectId}
            onChange={(event) => setDraft((prev) => ({ ...prev, subjectId: event.target.value, courseId: "", nodeId: "" }))}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">无学科</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={draft.courseId}
            onChange={(event) => setDraft((prev) => ({ ...prev, courseId: event.target.value, nodeId: "" }))}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">无课程</option>
            {courses
              .filter((course) => !draft.subjectId || course.subjectId === draft.subjectId)
              .map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
          </select>

          <select
            value={draft.nodeId}
            onChange={(event) => setDraft((prev) => ({ ...prev, nodeId: event.target.value }))}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">无章节/专题</option>
            {nodes
              .filter((node) => !draft.courseId || node.courseId === draft.courseId)
              .map((node) => (
                <option key={node.id} value={node.id}>
                  {node.title}
                </option>
              ))}
          </select>
        </div>

        <button type="submit" className="mt-3 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white">
          保存速记
        </button>
      </form>

      <article className="rounded-xl border border-ink/10 bg-white p-3">
        <h4 className="text-sm font-semibold text-ink">速记列表</h4>

        <ul className="mt-2 space-y-2">
          {quickNotes.map((note) => {
            const categoryName = categories.find((category) => category.id === note.categoryId)?.name;
            const courseName = courses.find((course) => course.id === note.courseId)?.name;
            const nodeName = nodes.find((node) => node.id === note.nodeId)?.title;
            const editing = editingId === note.id && editingDraft;
            const safeDraft = editing ? editingDraft : editDraft;

            return (
              <li key={note.id} className="rounded-lg border border-ink/10 p-2">
                {!editing && (
                  <>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="badge border-ink/15 bg-paper text-ink/70">{note.status}</span>
                      {categoryName && <span className="badge border-ink/15 bg-white text-ink/70">{categoryName}</span>}
                      {courseName && <span className="badge border-ink/15 bg-white text-ink/70">{courseName}</span>}
                    </div>

                    <p className="mt-2 text-sm font-medium text-ink">{note.title || "未命名速记"}</p>
                    <p className="mt-1 text-sm text-ink/80 whitespace-pre-wrap">{note.content}</p>
                    {nodeName && <p className="mt-1 text-xs text-ink/55">挂载节点：{nodeName}</p>}

                    <div className="mt-2 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(note.id)}
                        className="rounded border border-ink/15 px-2 py-1 text-xs"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(note.id)}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                      >
                        删除
                      </button>
                      {note.status !== "imported" && (
                        <button
                          type="button"
                          onClick={() => onImport(note.id)}
                          className="rounded bg-mint px-2 py-1 text-xs font-medium text-ink"
                        >
                          导入知识库
                        </button>
                      )}
                    </div>
                  </>
                )}

                {editing && safeDraft && (
                  <div className="space-y-2">
                    <input
                      value={safeDraft.title}
                      onChange={(event) =>
                        setEditingDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                      }
                      className="w-full rounded border border-ink/15 px-2 py-1 text-sm"
                    />
                    <textarea
                      value={safeDraft.content}
                      onChange={(event) =>
                        setEditingDraft((prev) => (prev ? { ...prev, content: event.target.value } : prev))
                      }
                      rows={3}
                      className="w-full rounded border border-ink/15 px-2 py-1 text-sm"
                    />
                    <input
                      value={safeDraft.tagsInput}
                      onChange={(event) =>
                        setEditingDraft((prev) => (prev ? { ...prev, tagsInput: event.target.value } : prev))
                      }
                      className="w-full rounded border border-ink/15 px-2 py-1 text-sm"
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate(note.id, toInput(safeDraft));
                          setEditingId(null);
                          setEditingDraft(null);
                        }}
                        className="rounded bg-ink px-2 py-1 text-xs text-white"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingDraft(null);
                        }}
                        className="rounded border border-ink/15 px-2 py-1 text-xs"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </article>
    </div>
  );
}