import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in KibabuiMart:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('kb-recent-searches');
      localStorage.removeItem('kibabui_marketplace_accounts');
      localStorage.removeItem('kibabui_active_session_id');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-6 text-left">
          <div className="w-full max-w-xl bg-white border border-slate-200/80 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-650" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  KibabuiMart Encountered a Glitch
                </h1>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  The application ran into an unexpected error. Please try refreshing or resetting the app's local state.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-red-400 overflow-auto max-h-60 border border-slate-900 shadow-inner select-text">
                <p className="font-extrabold text-white uppercase tracking-wider text-[10px] mb-2 text-slate-400">
                  CRASH DETAILS:
                </p>
                <p className="font-bold">{this.state.error.toString()}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-[10px] text-slate-450 whitespace-pre-wrap font-medium">
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button 
                onClick={this.handleReset}
                className="bg-primary hover:bg-primary/95 text-white font-extrabold h-11 px-5 rounded-xl w-full sm:w-auto shadow-md shadow-primary/15 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Reset App State
              </Button>
              <Button 
                variant="outline"
                onClick={this.handleGoHome}
                className="border-slate-200 hover:bg-slate-50 text-slate-600 font-bold h-11 px-5 rounded-xl w-full sm:w-auto flex items-center gap-2"
              >
                <Home className="h-4 w-4" /> Go to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
