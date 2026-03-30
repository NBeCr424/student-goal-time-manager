"use client";

import { KnowledgeSourceEntryPage } from "@/components/knowledge/knowledge-source-entry-page";

export function KnowledgeTodayNotePage() {
  return (
    <KnowledgeSourceEntryPage
      sourceType="today_note"
      title="今日知识速记"
      description="优先快速记录课堂重点和当下新学到的内容。"
      showTags={false}
    />
  );
}
