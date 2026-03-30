"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { TaskImportTarget } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const targetLabel: Record<TaskImportTarget, string> = {
  today: "导入今日计划",
  weekly: "导入本周计划",
  inbox: "导入收件箱",
};

export function ImportPanel() {
  const { state, actions } = useAppStore();
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState<TaskImportTarget>("today");
  const [jsonText, setJsonText] = useState("");
  const [feedback, setFeedback] = useState("");

  const selectedCount = useMemo(
    () => state.parsedImportTasks.filter((item) => item.selected).length,
    [state.parsedImportTasks],
  );

  const latestJobs = useMemo(() => state.urlImportJobs.slice(0, 3), [state.urlImportJobs]);

  function onParseUrl(event: FormEvent) {
    event.preventDefault();
    setFeedback("");
    actions.parseImportUrl(url);
  }

  function onParseJson() {
    const result = actions.importTasksFromJson(jsonText);
    setFeedback(result.message);
  }

  async function onSelectJsonFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setJsonText(text);
      setFeedback(`已读取文件：${file.name}，请点击“解析 JSON”。`);
    } catch {
      setFeedback("读取文件失败，请改用粘贴 JSON。");
    }

    event.target.value = "";
  }

  function onImportSelected() {
    actions.importSelectedTasks(target);
    setFeedback("已导入所选任务。");
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <p className="soft-label">JSON 导入（推荐）</p>
        <h3 className="mt-1 text-lg font-semibold">从另一个 APP 粘贴或上传 JSON</h3>
        <p className="mt-2 text-sm text-ink/70">支持直接数组，或带 `items/tasks/list/data` 字段的对象。</p>

        <textarea
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          rows={8}
          placeholder={`{
  "items": [
    { "title": "完成高数作业", "sourceUrl": "other-app://today" },
    { "name": "英语听力 30 分钟" }
  ]
}`}
          className="mt-3 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onParseJson} className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            解析 JSON
          </button>
          <label className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70">
            上传 JSON 文件
            <input type="file" accept=".json,.txt,application/json,text/plain" onChange={onSelectJsonFile} className="hidden" />
          </label>
        </div>
      </section>

      <section className="card-surface p-4 md:p-5">
        <p className="soft-label">URL Mock（保留）</p>
        <h3 className="mt-1 text-lg font-semibold">粘贴网页链接模拟识别任务</h3>

        <form onSubmit={onParseUrl} className="mt-3 flex flex-col gap-2 sm:flex-row">
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

        {state.parsedImportTasks.length === 0 && <p className="mt-2 text-sm text-ink/60">暂无可导入任务，请先解析 JSON 或 URL。</p>}

        {state.parsedImportTasks.length > 0 && (
          <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-sm text-ink/75">已选 {selectedCount} 条任务</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["today", "weekly", "inbox"] as TaskImportTarget[]).map((value) => (
                <label key={value} className="flex items-center gap-1 text-sm text-ink/70">
                  <input type="radio" checked={target === value} onChange={() => setTarget(value)} className="accent-ink" />
                  {targetLabel[value]}
                </label>
              ))}
            </div>

            <button type="button" onClick={onImportSelected} className="mt-3 rounded-xl bg-mint px-4 py-2 text-sm font-medium text-ink">
              导入所选任务
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="card-surface p-4">
          <h4 className="section-title">最近导入记录</h4>
          <ul className="mt-2 space-y-1">
            {latestJobs.map((job) => (
              <li key={job.id} className="text-xs text-ink/65">
                {job.sourceUrl} · {job.status} · 识别 {job.parsedCount} 条
              </li>
            ))}
          </ul>
          {latestJobs.length === 0 && <p className="mt-2 text-xs text-ink/60">暂无导入记录。</p>}
        </article>

        <article className="card-surface p-4">
          <h4 className="section-title">导入收件箱</h4>
          <p className="mt-1 text-sm text-ink/70">当前待整理：{state.taskImportInbox.length} 条</p>
          <p className="mt-2 text-xs text-ink/60">选择“导入收件箱”目标后，可在后续再分类处理。</p>
        </article>
      </section>

      {feedback && <p className="px-1 text-center text-xs text-ink/65">{feedback}</p>}
    </div>
  );
}
