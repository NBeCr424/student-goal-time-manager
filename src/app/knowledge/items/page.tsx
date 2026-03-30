import { Suspense } from "react";
import { KnowledgeItemsPage } from "@/components/knowledge/knowledge-items-page";

export default function KnowledgeItemsRoutePage() {
  return (
    <Suspense fallback={<div className="card-surface p-4 text-sm text-ink/65">加载中...</div>}>
      <KnowledgeItemsPage />
    </Suspense>
  );
}
