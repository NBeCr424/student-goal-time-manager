import { KnowledgeCategoryFolderDetailPage } from "@/components/knowledge/knowledge-category-folder-detail-page";

interface KnowledgeCategoryFolderDetailRoutePageProps {
  params: { categoryId: string };
}

export default function KnowledgeCategoryFolderDetailRoutePage({ params }: KnowledgeCategoryFolderDetailRoutePageProps) {
  return <KnowledgeCategoryFolderDetailPage categoryId={params.categoryId} />;
}
