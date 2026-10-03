import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, RotateCcw, Home } from 'lucide-react';

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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetAll = () => {
    try {
      localStorage.removeItem('DEMAND_LIST_ITEMS_V1');
      localStorage.removeItem('DEMAND_LIST_SNAPSHOTS_V1');
      localStorage.removeItem('DEMAND_LIST_STORE_NAME_V1');
      localStorage.removeItem('DEMAND_LIST_INVOICES_V1');
      localStorage.removeItem('DEMAND_LIST_CURRENCY_V1');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 sm:p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
              Application Encountered an Error
            </h1>
            <p className="text-sm text-neutral-600 mb-6">
              The software experienced an unexpected state error. You can reload the page or reset the inventory data back to default items.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1F4E78] hover:bg-[#163a59] text-white rounded-xl font-medium text-sm transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleResetAll}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-medium text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Data to Default
              </button>
            </div>

            {this.state.error && (
              <div className="text-left bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <p className="text-xs font-mono text-neutral-700 font-semibold mb-1">
                  Error Details:
                </p>
                <p className="text-xs font-mono text-rose-600 break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
