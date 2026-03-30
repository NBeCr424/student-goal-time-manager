import Link from "next/link";

export default function ProfileIntegrationsPage() {
  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <h2 className="section-title">云端集成已移除</h2>
        <p className="mt-2 text-sm text-ink/70">项目已改为纯本地模式，不再提供 Supabase 令牌和外部 API 导入。</p>
        <Link href="/plan?tab=import" className="mt-3 inline-flex rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
          前往本地导入
        </Link>
      </section>
    </div>
  );
}
