import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
          <section className="w-full rounded-2xl border border-warn/30 bg-white p-6 text-center">
            <h1 className="text-xl font-semibold text-brand-dark">页面暂时不可用</h1>
            <p className="mt-2 text-sm text-slate-700">请刷新重试，数据已保存在本地。</p>
            <button
              type="button"
              className="mt-4 min-h-12 rounded-xl bg-brand px-4 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
