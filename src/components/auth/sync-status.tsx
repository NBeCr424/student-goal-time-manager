"use client";

export function SyncStatusChip() {
  return <span className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs text-ink/70">本地模式</span>;
}

export function SyncStatusBanner() {
  return null;
}

export function SyncStatusPanel() {
  return (
    <article className="card-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="soft-label">数据模式</p>
          <h3 className="mt-1 text-base font-semibold text-ink">本地模式</h3>
        </div>
        <span className="badge border-ink/15 bg-white text-ink/70">已就绪</span>
      </div>

      <p className="mt-2 text-sm text-ink/70">已移除 Supabase，当前数据仅保存在本设备浏览器本地存储。</p>
      <p className="mt-1 text-xs text-ink/55">如需导入外部任务，可前往“计划 &gt; 导入”。</p>
    </article>
  );
}
