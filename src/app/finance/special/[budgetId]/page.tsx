import { FinanceSpecialDetailPage } from "@/components/finance/finance-special-detail-page";

export default function FinanceSpecialDetailRoutePage({ params }: { params: { budgetId: string } }) {
  return <FinanceSpecialDetailPage budgetId={params.budgetId} />;
}
