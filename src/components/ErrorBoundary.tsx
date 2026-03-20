import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App crashed", { error, errorInfo });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
          <section className="max-w-xl rounded-lg border border-red-500/60 bg-red-950/30 p-4">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-red-100">{this.state.message}</p>
            <button
              className="mt-4 rounded bg-red-500 px-3 py-1 text-sm font-medium text-white"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
