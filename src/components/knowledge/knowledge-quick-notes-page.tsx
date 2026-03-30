"use client";

import Link from "next/link";
import { QuickNotePanel } from "@/components/knowledge/quick-note-panel";
import { useAppStore } from "@/store/app-store";

export function KnowledgeQuickNotesPage() {
  const { state, actions } = useAppStore();

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">速记</h2>
            <p className="mt-1 text-sm text-ink/65">轻量记录，后续可一键导入知识条目。</p>
          </div>
          <Link href="/knowledge" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回知识库
          </Link>
        </div>
      </section>

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
    </div>
  );
}
