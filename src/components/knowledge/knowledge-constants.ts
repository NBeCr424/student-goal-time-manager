import { KnowledgeItemType, KnowledgeLearningStatus, KnowledgeNodeType } from "@/lib/types";

export const knowledgeItemTypeOptions: Array<{ label: string; value: KnowledgeItemType }> = [
  { label: "普通笔记", value: "note" },
  { label: "方法总结", value: "method" },
  { label: "错题整理", value: "mistake" },
  { label: "链接收藏", value: "link" },
  { label: "PDF 摘要", value: "pdf_summary" },
  { label: "速记导入", value: "quick_note_import" },
  { label: "专题总结", value: "topic_summary" },
  { label: "章节总结", value: "chapter_summary" },
];

export const knowledgeNodeTypeLabel: Record<KnowledgeNodeType, string> = {
  chapter: "章节",
  topic: "专题",
  summary: "总结",
  resource: "资料",
};

export const learningStatusOptions: Array<{ label: string; value: KnowledgeLearningStatus }> = [
  { label: "未开始", value: "not_started" },
  { label: "学习中", value: "learning" },
  { label: "已掌握", value: "mastered" },
  { label: "待复习", value: "review_pending" },
];

export const learningStatusLabel: Record<KnowledgeLearningStatus, string> = {
  not_started: "未开始",
  learning: "学习中",
  mastered: "已掌握",
  review_pending: "待复习",
};

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toTagsInput(tags: string[]): string {
  return tags.join(", ");
}
