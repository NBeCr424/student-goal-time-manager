import { GoalDetailPage } from "@/components/plan/goal-detail-page";

export default function GoalDetailRoute({ params }: { params: { goalId: string } }) {
  return <GoalDetailPage goalId={params.goalId} />;
}