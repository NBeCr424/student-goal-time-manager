import { useNavigate } from "react-router-dom";

export function PrimaryActionBar() {
  const navigate = useNavigate();

  return (
    <section className="sticky top-[62px] z-10 rounded-2xl border border-brand/20 bg-white p-3">
      <h2 className="text-sm font-semibold text-brand-dark">首屏核心操作</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => navigate("/goals")}
          className="min-h-12 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
        >
          新建目标
        </button>
        <button
          type="button"
          onClick={() => navigate("/todos")}
          className="min-h-12 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
        >
          新建待办
        </button>
        <button
          type="button"
          onClick={() => navigate("/focus")}
          className="min-h-12 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
        >
          启动计时
        </button>
      </div>
    </section>
  );
}
