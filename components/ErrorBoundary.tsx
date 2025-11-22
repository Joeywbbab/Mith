import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-zinc-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-xl shadow-lg border border-zinc-200 p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                  Something went wrong
                </h1>

                <p className="text-sm text-zinc-500 mb-6">
                  We're sorry, but something unexpected happened. The error has been logged.
                </p>

                {this.state.error && (
                  <details className="w-full mb-6 text-left">
                    <summary className="text-xs font-medium text-zinc-400 cursor-pointer hover:text-zinc-600 mb-2">
                      Error details
                    </summary>
                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                      <p className="text-xs text-red-600 font-mono break-all">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <pre className="text-[10px] text-zinc-500 mt-2 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-2.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                >
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
