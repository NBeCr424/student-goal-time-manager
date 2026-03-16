"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";

export function ImportPanel() {
  const { state, actions } = useAppStore();
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState<"today" | "weekly">("today");

  const selectedCount = useMemo(
    () => state.parsedImportTasks.filter((item) => item.selected).length,
    [state.parsedImportTasks],
  );

  function onParse(event: FormEvent) {
    event.preventDefault();
    actions.parseImportUrl(url);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <p className="soft-label">外部任务导入（MVP Mock）</p>
        <h3 className="mt-1 text-lg font-semibold">粘贴网址，模拟识别任务后导入计划</h3>
        <p className="mt-2 text-sm text-ink/70">当前为 mock 解析流程。后续可在此接入真实网页解析 API。</p>

        <form onSubmit={onParse} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            模拟解析
          </button>
        </form>
      </section>

      <section className="card-surface p-4">
        <h4 className="section-title">识别结果</h4>

        <ul className="mt-3 space-y-2">
          {state.parsedImportTasks.map((item) => (
            <li key={item.id} className="rounded-xl border border-ink/10 bg-white p-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => actions.toggleImportTaskSelection(item.id)}
                  className="mt-1 h-4 w-4 accent-mint"
                />
                <span className="text-sm text-ink/85">
                  {item.title}
                  <span className="mt-1 block text-xs text-ink/55">来源：{item.sourceUrl}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        {state.parsedImportTasks.length === 0 && <p className="mt-2 text-sm text-ink/60">暂无解析结果。</p>}

        {state.parsedImportTasks.length > 0 && (
          <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-sm text-ink/75">已选 {selectedCount} 条任务</p>
            <div className="mt-2 flex gap-2">
              <label className="flex items-center gap-1 text-sm text-ink/70">
                <input
                  type="radio"
                  checked={target === "today"}
                  onChange={() => setTarget("today")}
                  className="accent-ink"
                />
                导入今日计划
              </label>
              <label className="flex items-center gap-1 text-sm text-ink/70">
                <input
                  type="radio"
                  checked={target === "weekly"}
                  onChange={() => setTarget("weekly")}
                  className="accent-ink"
                />
                导入本周计划
              </label>
            </div>

            <button
              type="button"
              onClick={() => actions.importSelectedTasks(target)}
              className="mt-3 rounded-xl bg-mint px-4 py-2 text-sm font-medium text-ink"
            >
              导入所选任务
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
