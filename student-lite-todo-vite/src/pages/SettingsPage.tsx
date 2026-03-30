import { downloadSnapshot } from "../lib/export";
import { useAppData } from "../store/useAppData";
import { useToast } from "../components/ToastProvider";

export function SettingsPage() {
  const { exportSnapshot } = useAppData();
  const { pushToast } = useToast();

  function handleExport() {
    downloadSnapshot(exportSnapshot());
    pushToast("已导出本地数据");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-brand/20 bg-white p-4">
        <h2 className="text-sm font-semibold text-brand-dark">本地导出</h2>
        <p className="mt-2 text-sm text-slate-600">
          数据保存在本机 IndexedDB。你可以手动导出 JSON 备份，不需要登录。
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="mt-3 min-h-12 w-full rounded-xl bg-brand px-3 text-sm font-semibold text-white"
        >
          导出本地数据
        </button>
      </section>
    </div>
  );
}
