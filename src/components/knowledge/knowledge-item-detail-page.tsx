"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KnowledgeEditor } from "@/components/knowledge/knowledge-editor";
import { knowledgeItemTypeOptions } from "@/components/knowledge/knowledge-constants";
import { useAppStore } from "@/store/app-store";

interface KnowledgeItemDetailPageProps {
  itemId: string;
}

export function KnowledgeItemDetailPage({ itemId }: KnowledgeItemDetailPageProps) {
  const router = useRouter();
  const { state, actions } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [hint, setHint] = useState("");

  const item = state.knowledgeItems.find((entry) => entry.id === itemId);
  const itemTypeLabel = useMemo(
    () => Object.fromEntries(knowledgeItemTypeOptions.map((option) => [option.value, option.label])),
    [],
  );

  if (!item) {
    return (
      <div className="card-surface p-4">
        <h2 className="section-title">条目不存在</h2>
        <p className="mt-2 text-sm text-ink/65">该知识条目可能已删除。</p>
        <Link href="/knowledge/items" className="mt-3 inline-flex rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm">
          返回知识列表
        </Link>
      </div>
    );
  }

  const category = item.categoryId ? state.knowledgeCategories.find((entry) => entry.id === item.categoryId)?.name : "未设置";
  const subject = item.subjectId ? state.knowledgeSubjects.find((entry) => entry.id === item.subjectId)?.name : "未设置";
  const course = item.courseId ? state.knowledgeCourses.find((entry) => entry.id === item.courseId)?.name : "未设置";
  const node = item.nodeId ? state.knowledgeNodes.find((entry) => entry.id === item.nodeId)?.title : "未设置";
  const sourceTypeLabel =
    item.sourceType === "today_note" ? "今日速记" : item.sourceType === "outside_knowledge" ? "非课堂积累" : "未设置";
  const relatedTasks = state.tasks.filter((task) => item.relatedTaskIds.includes(task.id));

  function convertToTodayTask() {
    if (!item) {
      return;
    }
    actions.addTask(`复习资料：${item.title}`, "today_other");
    setHint("已转为今日任务，可在日计划继续安排时间。");
  }

  function removeItem() {
    if (!item) {
      return;
    }
    actions.deleteKnowledgeItem(item.id);
    router.push("/knowledge/items");
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="soft-label">{itemTypeLabel[item.type]}</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{item.title}</h2>
            <p className="mt-1 text-xs text-ink/55">创建于 {item.createdAt} · 更新于 {item.updatedAt}</p>
          </div>
          <Link href="/knowledge/items" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回列表
          </Link>
        </div>

        <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink/85 whitespace-pre-wrap">
          {item.content}
        </div>

        {item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="badge border-ink/15 bg-paper text-ink/70">#{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink/65 space-y-1">
          <p>来源：{sourceTypeLabel}</p>
          <p>分类：{category}</p>
          <p>学科：{subject}</p>
          <p>课程：{course}</p>
          <p>节点：{node}</p>
        </div>

        {(item.attachments?.length ?? 0) > 0 && (
          <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink/70">
            <p className="font-medium text-ink">附件</p>
            <ul className="mt-2 space-y-1">
              {item.attachments?.map((attachment) => (
                <li key={attachment.id}>
                  {attachment.name} · {attachment.fileType} · {attachment.sizeKb}KB
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing(true)} className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs">
            编辑
          </button>
          <button type="button" onClick={removeItem} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            删除
          </button>
          <button type="button" onClick={convertToTodayTask} className="rounded-xl border border-mint/40 bg-mint/15 px-3 py-2 text-xs">
            转为今日任务
          </button>
          <Link href="/profile?tab=review" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            去复盘记录效果
          </Link>
        </div>

        {hint && <p className="mt-2 text-xs text-ink/65">{hint}</p>}
      </section>

      <section className="card-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">关联任务</h3>
          <Link href="/plan?tab=today" className="text-xs text-ink/65 underline">
            去今日任务
          </Link>
        </div>

        <ul className="mt-3 space-y-2">
          {relatedTasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-ink/10 bg-white p-3">
              <p className="text-sm font-medium text-ink">{task.title}</p>
              <p className="mt-1 text-xs text-ink/55">{task.completed ? "已完成" : "未完成"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/knowledge/items?taskId=${task.id}`} className="rounded-full border border-ink/15 bg-paper px-2 py-0.5 text-[11px] text-ink/70">
                  查看该任务全部资料
                </Link>
                <Link href="/plan?tab=today" className="rounded-full border border-ink/15 bg-white px-2 py-0.5 text-[11px] text-ink/70">
                  去安排时间
                </Link>
              </div>
            </li>
          ))}
        </ul>
        {relatedTasks.length === 0 && <p className="mt-2 text-sm text-ink/60">该条目暂无关联任务。</p>}
      </section>

      {editing && (
        <KnowledgeEditor
          categories={state.knowledgeCategories}
          subjects={state.knowledgeSubjects}
          courses={state.knowledgeCourses}
          nodes={state.knowledgeNodes}
          tasks={state.tasks}
          initialItem={item}
          onSave={(input) => {
            actions.updateKnowledgeItem(item.id, input);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
