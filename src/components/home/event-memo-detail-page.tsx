"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";

interface EventMemoDetailPageProps {
  eventMemoId: string;
}

export function EventMemoDetailPage({ eventMemoId }: EventMemoDetailPageProps) {
  const { state, actions } = useAppStore();
  const [hint, setHint] = useState("");

  const eventMemo = state.eventMemos.find((item) => item.id === eventMemoId);
  const eventSteps = useMemo(() => [...(eventMemo?.steps ?? [])].sort((a, b) => a.order - b.order), [eventMemo?.steps]);

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [targetOutcome, setTargetOutcome] = useState("");
  const [newStepTitle, setNewStepTitle] = useState("");
  const [knowledgeItemId, setKnowledgeItemId] = useState("");

  useEffect(() => {
    if (!eventMemo) {
      return;
    }

    setTitle(eventMemo.title);
    setDeadline(eventMemo.deadline ?? "");
    setTargetOutcome(eventMemo.targetOutcome ?? "");
  }, [eventMemo]);

  useEffect(() => {
    if (!eventMemo) {
      return;
    }
    if (eventMemo.steps.length > 0) {
      return;
    }

    actions.addEventMemoStep(eventMemo.id, "第一步");
    actions.addEventMemoStep(eventMemo.id, "第二步");
    actions.addEventMemoStep(eventMemo.id, "第三步");
  }, [actions, eventMemo]);

  useEffect(() => {
    if (state.knowledgeItems.length === 0) {
      setKnowledgeItemId("");
      return;
    }

    setKnowledgeItemId((prev) => {
      if (prev && state.knowledgeItems.some((item) => item.id === prev)) {
        return prev;
      }
      return state.knowledgeItems[0].id;
    });
  }, [state.knowledgeItems]);

  if (!eventMemo) {
    return (
      <section className="card-surface p-4">
        <h2 className="section-title">事件不存在</h2>
        <p className="mt-2 text-sm text-ink/65">该事件可能已删除或尚未同步。</p>
        <Link href="/" className="mt-3 inline-flex rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink/70">
          返回首页
        </Link>
      </section>
    );
  }

  const currentEventMemo = eventMemo;
  const doneCount = eventSteps.filter((step) => step.completed).length;
  const progress = eventSteps.length === 0 ? 0 : Math.round((doneCount / eventSteps.length) * 100);
  const relatedKnowledge = state.knowledgeItems.filter((item) => currentEventMemo.relatedKnowledgeItemIds.includes(item.id));
  const linkedTasks = state.tasks.filter((task) => currentEventMemo.linkedTaskIds.includes(task.id));

  function saveMainInfo() {
    const nextAction = eventSteps.find((step) => !step.completed)?.title ?? "继续推进下一步";
    actions.updateEventMemo(currentEventMemo.id, {
      title,
      deadline,
      targetOutcome,
      nextAction,
    });
    setHint("已保存。");
  }

  function addStep(event: FormEvent) {
    event.preventDefault();
    const clean = newStepTitle.trim();
    if (!clean) {
      return;
    }

    actions.addEventMemoStep(currentEventMemo.id, clean);
    setNewStepTitle("");
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="soft-label">事件备忘</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">行动清单</h2>
            <p className="mt-1 text-xs text-ink/60">创建于 {currentEventMemo.createdAt} · 更新于 {currentEventMemo.updatedAt}</p>
          </div>
          <Link href="/" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回首页
          </Link>
        </div>
      </section>

      <section className="card-surface p-4">
        <div className="space-y-4">
          <label className="block text-xs text-ink/65">
            1. 事件标题
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              placeholder="例如：准备周五课堂展示"
            />
          </label>

          <label className="block text-xs text-ink/65">
            2. 截止时间
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </label>

          <section className="rounded-2xl border-2 border-mint/35 bg-mint/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">3. 提醒事项 / 步骤清单</h3>
              <span className="badge border-ink/15 bg-white text-ink/70">
                {doneCount}/{eventSteps.length}
              </span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-white/80">
              <div className="h-2 rounded-full bg-mint" style={{ width: `${progress}%` }} />
            </div>

            <ul className="mt-3 space-y-2">
              {eventSteps.map((step, index) => (
                <li key={step.id} className="rounded-xl border border-ink/10 bg-white px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={() => actions.toggleEventMemoStep(currentEventMemo.id, step.id)}
                      className="h-4 w-4 accent-mint"
                    />
                    <span className={`flex-1 text-sm ${step.completed ? "text-ink/45 line-through" : "text-ink"}`}>
                      {step.title}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => actions.reorderEventMemoStep(currentEventMemo.id, step.id, "up")}
                        disabled={index === 0}
                        className="rounded border border-ink/15 px-2 text-xs text-ink/65 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.reorderEventMemoStep(currentEventMemo.id, step.id, "down")}
                        disabled={index === eventSteps.length - 1}
                        className="rounded border border-ink/15 px-2 text-xs text-ink/65 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.deleteEventMemoStep(currentEventMemo.id, step.id)}
                        className="rounded border border-ink/15 px-2 text-xs text-ink/65"
                      >
                        删
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={addStep} className="mt-3 flex gap-2">
              <input
                value={newStepTitle}
                onChange={(event) => setNewStepTitle(event.target.value)}
                placeholder="继续添加步骤，例如：第四步：演练一次"
                className="flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-white">
                添加
              </button>
            </form>
          </section>

          <label className="block text-xs text-ink/65">
            4. 最终要达到的效果
            <input
              value={targetOutcome}
              onChange={(event) => setTargetOutcome(event.target.value)}
              className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              placeholder="例如：展示时能在 5 分钟内完整讲清重点"
            />
          </label>

          <button type="button" onClick={saveMainInfo} className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存
          </button>
        </div>
      </section>

      <details className="card-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">更多操作（低频）</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => actions.moveEventMemoToPlan(currentEventMemo.id, "today")}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/75"
          >
            转入今日任务
          </button>
          <button
            type="button"
            onClick={() => actions.moveEventMemoToPlan(currentEventMemo.id, "tomorrow")}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/75"
          >
            转入明日计划
          </button>
          <button
            type="button"
            onClick={() => actions.moveEventMemoToPlan(currentEventMemo.id, "weekly")}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/75"
          >
            转入本周任务
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
          <p className="text-xs text-ink/60">关联知识资料</p>
          <div className="mt-2 flex gap-2">
            <select
              value={knowledgeItemId}
              onChange={(event) => setKnowledgeItemId(event.target.value)}
              className="flex-1 rounded-xl border border-ink/15 bg-paper px-3 py-2 text-sm"
            >
              {state.knowledgeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => knowledgeItemId && actions.linkEventMemoToKnowledge(currentEventMemo.id, knowledgeItemId)}
              className="rounded-xl border border-ink/15 bg-paper px-3 py-2 text-xs text-ink/75"
            >
              关联
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {relatedKnowledge.map((item) => (
              <span key={item.id} className="badge border-ink/15 bg-paper text-ink/65">
                {item.title}
              </span>
            ))}
            {relatedKnowledge.length === 0 && <p className="text-xs text-ink/55">还未关联资料。</p>}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
          <p className="text-xs text-ink/60">已关联任务 {linkedTasks.length} 项</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/75">
            {linkedTasks.map((task) => (
              <li key={task.id}>- {task.title}</li>
            ))}
            {linkedTasks.length === 0 && <li className="text-xs text-ink/55">还没有关联任务。</li>}
          </ul>
        </div>
      </details>

      {hint && <p className="text-center text-xs text-ink/65">{hint}</p>}
    </div>
  );
}
