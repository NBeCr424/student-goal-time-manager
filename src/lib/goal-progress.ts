import { Goal, Task } from "@/lib/types";

interface GoalProgressMetrics {
  percent: number;
  breakdownDone: number;
  breakdownTotal: number;
  distributedDone: number;
  distributedTotal: number;
}

const BREAKDOWN_WEIGHT = 0.6;
const DISTRIBUTED_TASK_WEIGHT = 0.4;

export function calculateGoalProgress(goal: Goal, tasks: Task[]): GoalProgressMetrics {
  const linkedTasks = tasks.filter((task) => task.goalId === goal.id);
  const breakdownTotal = goal.breakdownItems.length;
  const breakdownDone = goal.breakdownItems.filter((item) => item.completed).length;
  const distributedTotal = linkedTasks.length;
  const distributedDone = linkedTasks.filter((task) => task.completed).length;

  if (breakdownTotal === 0 && distributedTotal === 0) {
    return {
      percent: goal.progress,
      breakdownDone,
      breakdownTotal,
      distributedDone,
      distributedTotal,
    };
  }

  let weightedScore = 0;
  let totalWeight = 0;

  if (breakdownTotal > 0) {
    weightedScore += (breakdownDone / breakdownTotal) * BREAKDOWN_WEIGHT;
    totalWeight += BREAKDOWN_WEIGHT;
  }

  if (distributedTotal > 0) {
    weightedScore += (distributedDone / distributedTotal) * DISTRIBUTED_TASK_WEIGHT;
    totalWeight += DISTRIBUTED_TASK_WEIGHT;
  }

  const percent = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

  return {
    percent,
    breakdownDone,
    breakdownTotal,
    distributedDone,
    distributedTotal,
  };
}
