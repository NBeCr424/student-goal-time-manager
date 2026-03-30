import { uid } from "./id";
import { nowIso, todayKey } from "./date";
import { Todo } from "../types";

function shiftDate(base: string, days: number): string {
  const date = new Date(`${base}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildGoalBreakdown(goalId: string, goalName: string, deadline: string): Todo[] {
  const now = nowIso();
  const start = todayKey();
  const parentSpecs = [
    { title: `${goalName} 范围梳理`, children: ["确认知识清单", "整理学习资料"] },
    { title: `${goalName} 核心学习`, children: ["完成重点章节", "整理错题与笔记"] },
    { title: `${goalName} 冲刺复盘`, children: ["限时模拟练习", "总结改进清单"] },
  ];

  const todos: Todo[] = [];

  parentSpecs.forEach((spec, index) => {
    const parentId = uid("todo");
    const parentDue = shiftDate(start, index * 2);

    todos.push({
      id: parentId,
      title: spec.title,
      goalId,
      dueDate: parentDue > deadline ? deadline : parentDue,
      priority: index === 0 ? "high" : "medium",
      isDone: false,
      createdAt: now,
      updatedAt: now,
    });

    spec.children.forEach((childTitle, childIndex) => {
      const childDue = shiftDate(parentDue, childIndex + 1);
      todos.push({
        id: uid("todo"),
        title: childTitle,
        goalId,
        dueDate: childDue > deadline ? deadline : childDue,
        priority: childIndex === 0 ? "high" : "medium",
        parentId,
        isDone: false,
        createdAt: now,
        updatedAt: now,
      });
    });
  });

  return todos;
}
