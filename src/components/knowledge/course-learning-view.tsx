"use client";

import { useMemo } from "react";
import {
  KnowledgeCourse,
  KnowledgeItem,
  KnowledgeLearningStatus,
  KnowledgeNode,
  PdfKnowledgeDocument,
  QuickNote,
  Task,
} from "@/lib/types";
import {
  learningStatusLabel,
  learningStatusOptions,
  knowledgeNodeTypeLabel,
} from "@/components/knowledge/knowledge-constants";

interface CourseLearningViewProps {
  selectedCourseId?: string;
  selectedNodeId?: string;
  courses: KnowledgeCourse[];
  nodes: KnowledgeNode[];
  items: KnowledgeItem[];
  quickNotes: QuickNote[];
  pdfDocuments: PdfKnowledgeDocument[];
  tasks: Task[];
  onUpdateCourseStatus: (courseId: string, status: KnowledgeLearningStatus) => void;
  onUpdateNodeStatus: (nodeId: string, status: KnowledgeLearningStatus) => void;
}

export function CourseLearningView({
  selectedCourseId,
  selectedNodeId,
  courses,
  nodes,
  items,
  quickNotes,
  pdfDocuments,
  tasks,
  onUpdateCourseStatus,
  onUpdateNodeStatus,
}: CourseLearningViewProps) {
  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  const courseNodes = useMemo(
    () => nodes.filter((node) => node.courseId === selectedCourseId).sort((a, b) => a.order - b.order),
    [nodes, selectedCourseId],
  );

  if (!selectedCourse) {
    return (
      <article className="card-surface p-4 md:p-5">
        <h3 className="section-title">Course View</h3>
        <p className="mt-2 text-sm text-ink/65">Pick one course from the tree to view chapter/topic/summary progress.</p>
      </article>
    );
  }

  if (selectedNode) {
    const nodeItems = items.filter((item) => item.nodeId === selectedNode.id);
    const nodeNotes = quickNotes.filter((note) => note.nodeId === selectedNode.id);
    const nodeDocs = pdfDocuments.filter((doc) => doc.nodeId === selectedNode.id);
    const nodeTaskIds = Array.from(new Set(nodeItems.flatMap((item) => item.relatedTaskIds)));
    const relatedTasks = tasks.filter((task) => nodeTaskIds.includes(task.id));
    const mistakeItems = nodeItems.filter((item) => item.type === "mistake");

    return (
      <article className="card-surface p-4 md:p-5">
        <p className="soft-label">
          {selectedCourse.name} {" > "} {knowledgeNodeTypeLabel[selectedNode.type]}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-ink">{selectedNode.title}</h3>
        <p className="mt-2 text-sm text-ink/70">{selectedNode.description}</p>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-ink/65">Learning Status</span>
          <select
            value={selectedNode.status}
            onChange={(event) => onUpdateNodeStatus(selectedNode.id, event.target.value as KnowledgeLearningStatus)}
            className="rounded-lg border border-ink/15 px-2 py-1 text-sm"
          >
            {learningStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <section className="rounded-xl border border-ink/10 bg-white p-3">
            <h4 className="text-sm font-semibold text-ink">Node Knowledge Items</h4>
            <ul className="mt-2 space-y-1 text-sm text-ink/80">
              {nodeItems.map((item) => (
                <li key={item.id}>- {item.title}</li>
              ))}
            </ul>
            {nodeItems.length === 0 && <p className="mt-2 text-xs text-ink/60">No items yet.</p>}
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-3">
            <h4 className="text-sm font-semibold text-ink">Quick Notes</h4>
            <ul className="mt-2 space-y-1 text-sm text-ink/80">
              {nodeNotes.map((note) => (
                <li key={note.id}>- {note.title || note.content.slice(0, 24)}</li>
              ))}
            </ul>
            {nodeNotes.length === 0 && <p className="mt-2 text-xs text-ink/60">No quick notes.</p>}
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-3">
            <h4 className="text-sm font-semibold text-ink">PDF Resources</h4>
            <ul className="mt-2 space-y-1 text-sm text-ink/80">
              {nodeDocs.map((doc) => (
                <li key={doc.id}>- {doc.title}</li>
              ))}
            </ul>
            {nodeDocs.length === 0 && <p className="mt-2 text-xs text-ink/60">No PDF docs.</p>}
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-3">
            <h4 className="text-sm font-semibold text-ink">Related Tasks and Mistakes</h4>
            <ul className="mt-2 space-y-1 text-sm text-ink/80">
              {relatedTasks.map((task) => (
                <li key={task.id}>- {task.title}</li>
              ))}
            </ul>
            {relatedTasks.length === 0 && <p className="mt-2 text-xs text-ink/60">No related tasks.</p>}

            <p className="mt-3 text-xs font-semibold text-ink/60">Mistake items: {mistakeItems.length}</p>
          </section>
        </div>
      </article>
    );
  }

  const courseItems = items.filter((item) => item.courseId === selectedCourse.id);
  const courseDocs = pdfDocuments.filter((doc) => doc.courseId === selectedCourse.id);
  const courseNotes = quickNotes.filter((note) => note.courseId === selectedCourse.id);
  const courseTaskIds = Array.from(new Set(courseItems.flatMap((item) => item.relatedTaskIds)));
  const relatedTasks = tasks.filter((task) => courseTaskIds.includes(task.id));

  const recentItems = courseItems.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const topicNodes = courseNodes.filter((node) => node.type === "topic");
  const summaryNodes = courseNodes.filter((node) => node.type === "summary");
  const chapterNodes = courseNodes.filter((node) => node.type === "chapter");

  return (
    <article className="card-surface p-4 md:p-5">
      <p className="soft-label">Course View</p>
      <h3 className="mt-1 text-lg font-semibold text-ink">{selectedCourse.name}</h3>
      <p className="mt-2 text-sm text-ink/70">{selectedCourse.description}</p>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-ink/65">Course Status</span>
        <select
          value={selectedCourse.status}
          onChange={(event) => onUpdateCourseStatus(selectedCourse.id, event.target.value as KnowledgeLearningStatus)}
          className="rounded-lg border border-ink/15 px-2 py-1 text-sm"
        >
          {learningStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink/55">Current: {learningStatusLabel[selectedCourse.status]}</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-ink/10 bg-white p-3">
          <h4 className="text-sm font-semibold text-ink">Chapter List</h4>
          <ul className="mt-2 space-y-1 text-sm text-ink/80">
            {chapterNodes.map((node) => (
              <li key={node.id}>- {node.title}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-3">
          <h4 className="text-sm font-semibold text-ink">Topic List</h4>
          <ul className="mt-2 space-y-1 text-sm text-ink/80">
            {topicNodes.map((node) => (
              <li key={node.id}>- {node.title}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-3">
          <h4 className="text-sm font-semibold text-ink">Summary Pages</h4>
          <ul className="mt-2 space-y-1 text-sm text-ink/80">
            {summaryNodes.map((node) => (
              <li key={node.id}>- {node.title}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-3">
          <h4 className="text-sm font-semibold text-ink">Recently Updated</h4>
          <ul className="mt-2 space-y-1 text-sm text-ink/80">
            {recentItems.map((item) => (
              <li key={item.id}>- {item.title}</li>
            ))}
          </ul>
          {recentItems.length === 0 && <p className="mt-2 text-xs text-ink/60">No updates yet.</p>}
        </section>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs text-ink/70">
        <p className="rounded-lg bg-white p-2">Knowledge items: {courseItems.length}</p>
        <p className="rounded-lg bg-white p-2">PDF documents: {courseDocs.length}</p>
        <p className="rounded-lg bg-white p-2">Quick notes: {courseNotes.length}</p>
      </div>

      <section className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
        <h4 className="text-sm font-semibold text-ink">Related Tasks</h4>
        <ul className="mt-2 space-y-1 text-sm text-ink/80">
          {relatedTasks.map((task) => (
            <li key={task.id}>- {task.title}</li>
          ))}
        </ul>
        {relatedTasks.length === 0 && <p className="mt-1 text-xs text-ink/60">No related tasks.</p>}
      </section>
    </article>
  );
}