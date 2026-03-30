"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  KnowledgeCategory,
  KnowledgeCourse,
  KnowledgeNode,
  KnowledgeSubject,
  PdfKnowledgeDocument,
  PdfUploadInput,
} from "@/lib/types";

interface PdfPanelProps {
  documents: PdfKnowledgeDocument[];
  categories: KnowledgeCategory[];
  subjects: KnowledgeSubject[];
  courses: KnowledgeCourse[];
  nodes: KnowledgeNode[];
  onUpload: (input: PdfUploadInput) => void;
  onSaveSummary: (documentId: string, categoryId?: string) => void;
}

export function PdfPanel({
  documents,
  categories,
  subjects,
  courses,
  nodes,
  onUpload,
  onSaveSummary,
}: PdfPanelProps) {
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSizeKb, setFileSizeKb] = useState(0);
  const [subjectId, setSubjectId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [saveCategoryId, setSaveCategoryId] = useState("cat_uncategorized");

  const availableCourses = useMemo(
    () => courses.filter((course) => !subjectId || course.subjectId === subjectId),
    [courses, subjectId],
  );
  const availableNodes = useMemo(
    () => nodes.filter((node) => !courseId || node.courseId === courseId),
    [courseId, nodes],
  );

  useEffect(() => {
    if (categories.some((category) => category.id === saveCategoryId)) {
      return;
    }
    const nextCategoryId = categories.find((category) => category.id === "cat_uncategorized")?.id ?? categories[0]?.id ?? "";
    setSaveCategoryId(nextCategoryId);
  }, [categories, saveCategoryId]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);
    setFileSizeKb(Math.max(1, Math.round(file.size / 1024)));
    if (!title.trim()) {
      setTitle(file.name.replace(/\.pdf$/i, ""));
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!fileName) {
      return;
    }

    onUpload({
      title: title.trim() || fileName,
      fileName,
      fileSizeKb,
      subjectId: subjectId || undefined,
      courseId: courseId || undefined,
      nodeId: nodeId || undefined,
    });

    setTitle("");
    setFileName("");
    setFileSizeKb(0);
    setSubjectId("");
    setCourseId("");
    setNodeId("");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="rounded-xl border border-ink/10 bg-white p-3">
        <h4 className="text-sm font-semibold text-ink">上传 PDF</h4>
        <p className="mt-1 text-xs text-ink/55">仅用于本地/云端保存与阅读。</p>

        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="文档标题"
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
          <input
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
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
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">选择学科</option>
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
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">选择课程</option>
            {availableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            value={nodeId}
            onChange={(event) => setNodeId(event.target.value)}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">选择章节/专题</option>
            {availableNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.title}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="mt-3 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white">
          上传文档
        </button>
      </form>

      <article className="rounded-xl border border-ink/10 bg-white p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-ink">PDF 文档节点</h4>
          <select
            value={saveCategoryId}
            onChange={(event) => setSaveCategoryId(event.target.value)}
            className="rounded border border-ink/15 px-2 py-1 text-xs"
          >
            {categories
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>

        <ul className="mt-2 space-y-3">
          {documents.map((doc) => {
            const courseName = courses.find((course) => course.id === doc.courseId)?.name;
            const nodeName = nodes.find((node) => node.id === doc.nodeId)?.title;
            return (
              <li key={doc.id} className="rounded-lg border border-ink/10 p-3">
                <p className="text-sm font-semibold text-ink">{doc.title}</p>
                <p className="mt-1 text-xs text-ink/55">
                  {doc.fileName} · {doc.fileSizeKb} KB
                </p>
                {(courseName || nodeName) && (
                  <p className="mt-1 text-xs text-ink/55">
                    {courseName || "未归属课程"}
                    {nodeName ? ` > ${nodeName}` : ""}
                  </p>
                )}

                {doc.summary && <p className="mt-2 text-sm text-ink/80">{doc.summary}</p>}
                {doc.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.keywords.map((keyword) => (
                      <span key={keyword} className="badge border-ink/15 bg-paper text-ink/70">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                {doc.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-ink/70">
                    {doc.highlights.map((highlight) => (
                      <li key={highlight}>- {highlight}</li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  disabled={Boolean(doc.savedAsKnowledgeItemId)}
                  onClick={() => onSaveSummary(doc.id, saveCategoryId)}
                  className="mt-2 rounded-lg bg-mint px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-40"
                >
                  {doc.savedAsKnowledgeItemId ? "已保存为知识条目" : "保存到知识库"}
                </button>
              </li>
            );
          })}
        </ul>

        {documents.length === 0 && <p className="mt-2 text-sm text-ink/60">暂无 PDF 文档。</p>}
      </article>
    </div>
  );
}
