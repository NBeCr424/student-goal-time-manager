"use client";

import { KnowledgeCourse, KnowledgeNode, KnowledgeSubject } from "@/lib/types";
import { knowledgeNodeTypeLabel } from "@/components/knowledge/knowledge-constants";

interface KnowledgeCourseTreeProps {
  subjects: KnowledgeSubject[];
  courses: KnowledgeCourse[];
  nodes: KnowledgeNode[];
  selectedCourseId?: string;
  selectedNodeId?: string;
  itemCountByCourse: Record<string, number>;
  itemCountByNode: Record<string, number>;
  onSelectCourse: (courseId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

export function KnowledgeCourseTree({
  subjects,
  courses,
  nodes,
  selectedCourseId,
  selectedNodeId,
  itemCountByCourse,
  itemCountByNode,
  onSelectCourse,
  onSelectNode,
}: KnowledgeCourseTreeProps) {
  return (
    <div className="space-y-3">
      {subjects
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((subject) => {
          const subjectCourses = courses
            .filter((course) => course.subjectId === subject.id)
            .sort((a, b) => a.order - b.order);

          return (
            <section key={subject.id} className="rounded-xl border border-ink/10 bg-white p-3">
              <h4 className="text-sm font-semibold text-ink">{subject.name}</h4>
              <p className="mt-1 text-xs text-ink/55">{subject.description}</p>

              <ul className="mt-2 space-y-2">
                {subjectCourses.map((course) => {
                  const courseNodes = nodes
                    .filter((node) => node.courseId === course.id)
                    .sort((a, b) => a.order - b.order);

                  return (
                    <li key={course.id} className="rounded-lg bg-paper/60 p-2">
                      <button
                        type="button"
                        className={`w-full rounded-lg px-2 py-1 text-left text-sm font-medium transition ${
                          selectedCourseId === course.id ? "bg-ink text-white" : "text-ink"
                        }`}
                        onClick={() => onSelectCourse(course.id)}
                      >
                        <span>{course.name}</span>
                        <span className="ml-2 text-xs opacity-75">({itemCountByCourse[course.id] ?? 0})</span>
                      </button>

                      <ul className="mt-2 space-y-1 pl-2">
                        {courseNodes.map((node) => (
                          <li key={node.id}>
                            <button
                              type="button"
                              className={`w-full rounded-md px-2 py-1 text-left text-xs transition ${
                                selectedNodeId === node.id
                                  ? "bg-mint/35 text-ink"
                                  : "text-ink/70 hover:bg-white/80"
                              }`}
                              onClick={() => {
                                onSelectCourse(course.id);
                                onSelectNode(node.id);
                              }}
                            >
                              <span>[{knowledgeNodeTypeLabel[node.type]}]</span>
                              <span className="ml-1">{node.title}</span>
                              <span className="ml-1 text-[11px] text-ink/50">({itemCountByNode[node.id] ?? 0})</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
    </div>
  );
}