import { KnowledgeItemDetailPage } from "@/components/knowledge/knowledge-item-detail-page";

interface KnowledgeItemDetailRoutePageProps {
  params: { itemId: string };
}

export default function KnowledgeItemDetailRoutePage({ params }: KnowledgeItemDetailRoutePageProps) {
  return <KnowledgeItemDetailPage itemId={params.itemId} />;
}
