"use client";

import { KnowledgeSourceEntryPage } from "@/components/knowledge/knowledge-source-entry-page";

export function KnowledgeOutsidePage() {
  return (
    <KnowledgeSourceEntryPage
      sourceType="outside_knowledge"
      title="非课堂知识积累"
      description="用于长期沉淀课外、自学、阅读和资料整理。"
      showTags
    />
  );
}
