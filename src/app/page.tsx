import { Suspense } from "react";
import { DashboardPage } from "@/components/home/dashboard-page";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="card-surface p-4 text-sm text-ink/65">首页加载中...</div>}>
      <DashboardPage />
    </Suspense>
  );
}
