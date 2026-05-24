import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught render error:', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-3xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">
              應用程式發生錯誤，請嘗試重新載入頁面。
            </p>
            {this.state.error && (
              <pre className="text-left text-xs text-gray-500 bg-white/5 rounded-xl p-4 mb-6 border border-white/10 overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-lg"
            >
              重新載入
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
