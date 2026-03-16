"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  KnowledgeCategory,
  KnowledgeCourse,
  KnowledgeItem,
  KnowledgeItemInput,
  KnowledgeNode,
  KnowledgeSubject,
  Task,
} from "@/lib/types";
import { knowledgeItemTypeOptions, parseTags, toTagsInput } from "@/components/knowledge/knowledge-constants";

interface KnowledgeEditorProps {
  categories: KnowledgeCategory[];
  subjects: KnowledgeSubject[];
  courses: KnowledgeCourse[];
  nodes: KnowledgeNode[];
  tasks: Task[];
  initialItem?: KnowledgeItem;
  defaultCourseId?: string;
  defaultNodeId?: string;
  onSave: (input: KnowledgeItemInput) => void;
  onCancel: () => void;
}

export function KnowledgeEditor({
  categories,
  subjects,
  courses,
  nodes,
  tasks,
  initialItem,
  defaultCourseId,
  defaultNodeId,
  onSave,
  onCancel,
}: KnowledgeEditorProps) {
  const [title, setTitle] = useState(initialItem?.title ?? "");
  const [type, setType] = useState(initialItem?.type ?? "note");
  const [tagsInput, setTagsInput] = useState(toTagsInput(initialItem?.tags ?? []));
  const [content, setContent] = useState(initialItem?.content ?? "");
  const [categoryId, setCategoryId] = useState(initialItem?.categoryId ?? "");
  const [subjectId, setSubjectId] = useState(initialItem?.subjectId ?? "");
  const [courseId, setCourseId] = useState(initialItem?.courseId ?? defaultCourseId ?? "");
  const [nodeId, setNodeId] = useState(initialItem?.nodeId ?? defaultNodeId ?? "");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(initialItem?.relatedTaskIds ?? []);

  const filteredCourses = useMemo(() => {
    if (!subjectId) {
      return courses;
    }
    return courses.filter((course) => course.subjectId === subjectId);
  }, [courses, subjectId]);

  const filteredNodes = useMemo(() => {
    if (!courseId) {
      return nodes;
    }
    return nodes.filter((node) => node.courseId === courseId);
  }, [courseId, nodes]);

  const sortedCategories = useMemo(() => categories.slice().sort((a, b) => a.order - b.order), [categories]);

  function toggleTask(taskId: string) {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();

    onSave({
      title,
      type,
      tags: parseTags(tagsInput),
      content,
      categoryId: categoryId || undefined,
      subjectId: subjectId || undefined,
      courseId: courseId || undefined,
      nodeId: nodeId || undefined,
      relatedTaskIds: selectedTaskIds,
      sourceDocumentId: initialItem?.sourceDocumentId,
      sourceQuickNoteId: initialItem?.sourceQuickNoteId,
    });
  }

  return (
    <form onSubmit={submit} className="card-surface p-4 md:p-5">
      <h3 className="section-title">{initialItem ? "编辑知识条目" : "新建知识条目"}</h3>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="标题"
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          required
        />

        <select
          value={type}
          onChange={(event) => setType(event.target.value as KnowledgeItemInput["type"])}
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
        >
          {knowledgeItemTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
        >
          <option value="">无分类</option>
          {sortedCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? "- " : ""}
              {category.name}
            </option>
          ))}
        </select>

        <input
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          placeholder="标签，逗号分隔"
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <select
          value={subjectId}
          onChange={(event) => {
            setSubjectId(event.target.value);
            setCourseId("");
            setNodeId("");
          }}
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
        >
          <option value="">无学科归属</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <select
          value={courseId}
          onChange={(event) => {
            setCourseId(event.target.value);
            setNodeId("");
          }}
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
        >
          <option value="">无课程归属</option>
          {filteredCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>

        <select
          value={nodeId}
          onChange={(event) => setNodeId(event.target.value)}
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
        >
          <option value="">无章节/专题归属</option>
          {filteredNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.title}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={6}
        placeholder="正文内容"
        className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
        required
      />

      <div className="mt-2 rounded-xl border border-ink/10 bg-white p-3">
        <p className="text-xs font-semibold text-ink/60">关联任务（可多选）</p>
        <div className="mt-2 grid max-h-44 gap-1 overflow-auto pr-1 text-xs sm:grid-cols-2">
          {tasks.map((task) => (
            <label key={task.id} className="flex items-center gap-1 rounded-md bg-paper px-2 py-1">
              <input
                type="checkbox"
                checked={selectedTaskIds.includes(task.id)}
                onChange={() => toggleTask(task.id)}
                className="h-3.5 w-3.5 accent-mint"
              />
              <span>{task.title}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
          保存知识
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70"
        >
          取消
        </button>
      </div>
    </form>
  );
}