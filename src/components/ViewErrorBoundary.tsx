import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  name: string;
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ViewErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ViewErrorBoundary:${this.props.name}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4 bg-neutral-950">
          <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-200">{this.props.name} crashed</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md">
              {this.state.error?.message || 'An unexpected error occurred. Try reloading the view.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:bg-neutral-800"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
