"use client";

import { useEffect, useMemo, useState } from "react";
import { CourseLearningView } from "@/components/knowledge/course-learning-view";
import { KnowledgeCourseTree } from "@/components/knowledge/knowledge-course-tree";
import { useAppStore } from "@/store/app-store";

export function KnowledgeCoursesPage() {
  const { state, actions } = useAppStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(state.knowledgeCourses[0]?.id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedCourseId && state.knowledgeCourses.length > 0) {
      setSelectedCourseId(state.knowledgeCourses[0].id);
    }
  }, [selectedCourseId, state.knowledgeCourses]);

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

  const nodeOptions = useMemo(
    () => state.knowledgeNodes.filter((node) => !selectedCourseId || node.courseId === selectedCourseId),
    [selectedCourseId, state.knowledgeNodes],
  );

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <h2 className="section-title">课程学习地图</h2>
        <p className="mt-1 text-sm text-ink/65">按 课程 → 章节/专题/总结 浏览，手机端默认单列显示。</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select
            value={selectedCourseId ?? ""}
            onChange={(event) => {
              setSelectedCourseId(event.target.value || undefined);
              setSelectedNodeId(undefined);
            }}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">请选择课程</option>
            {state.knowledgeCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            value={selectedNodeId ?? ""}
            onChange={(event) => setSelectedNodeId(event.target.value || undefined)}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">查看课程总览</option>
            {nodeOptions.map((node) => (
              <option key={node.id} value={node.id}>
                {node.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="hidden xl:grid xl:grid-cols-[300px_1fr] xl:gap-4">
        <article className="card-surface p-3">
          <h3 className="text-sm font-semibold text-ink">课程树导航</h3>
          <div className="mt-2">
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
              onSelectNode={setSelectedNodeId}
            />
          </div>
        </article>

        <CourseLearningView
          selectedCourseId={selectedCourseId}
          selectedNodeId={selectedNodeId}
          courses={state.knowledgeCourses}
          nodes={state.knowledgeNodes}
          items={state.knowledgeItems}
          quickNotes={state.quickNotes}
          pdfDocuments={state.pdfDocuments}
          tasks={state.tasks}
          onUpdateCourseStatus={actions.updateCourseLearningStatus}
          onUpdateNodeStatus={actions.updateNodeLearningStatus}
        />
      </section>

      <section className="xl:hidden">
        <CourseLearningView
          selectedCourseId={selectedCourseId}
          selectedNodeId={selectedNodeId}
          courses={state.knowledgeCourses}
          nodes={state.knowledgeNodes}
          items={state.knowledgeItems}
          quickNotes={state.quickNotes}
          pdfDocuments={state.pdfDocuments}
          tasks={state.tasks}
          onUpdateCourseStatus={actions.updateCourseLearningStatus}
          onUpdateNodeStatus={actions.updateNodeLearningStatus}
        />
      </section>
    </div>
  );
}
