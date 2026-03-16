import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card-surface mx-auto max-w-lg p-6 text-center">
      <h2 className="text-xl font-semibold">页面不存在</h2>
      <p className="mt-2 text-sm text-ink/70">请返回首页继续管理今天最重要的三件事。</p>
      <Link href="/" className="mt-4 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-medium text-ink">
        返回首页
      </Link>
    </div>
  );
}
