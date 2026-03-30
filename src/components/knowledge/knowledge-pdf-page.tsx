"use client";

import Link from "next/link";
import { PdfPanel } from "@/components/knowledge/pdf-panel";
import { useAppStore } from "@/store/app-store";

export function KnowledgePdfPage() {
  const { state, actions } = useAppStore();

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">PDF 资料</h2>
            <p className="mt-1 text-sm text-ink/65">上传文档后生成 mock 摘要，并保存到知识库。</p>
          </div>
          <Link href="/knowledge" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回知识库
          </Link>
        </div>
      </section>

      <PdfPanel
        documents={state.pdfDocuments}
        categories={state.knowledgeCategories}
        subjects={state.knowledgeSubjects}
        courses={state.knowledgeCourses}
        nodes={state.knowledgeNodes}
        onUpload={actions.uploadPdfDocument}
        onSaveSummary={actions.savePdfSummaryToKnowledge}
      />
    </div>
  );
}
