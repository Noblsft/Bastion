import { Component, ErrorInfo, ReactNode } from 'react';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NotesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Notes] Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex items-center justify-center h-full p-8'>
          <div className='text-center max-w-md space-y-4'>
            <AlertTriangle className='h-12 w-12 text-destructive mx-auto' />
            <h2 className='text-xl font-semibold'>Something went wrong</h2>
            <p className='text-sm text-muted-foreground'>
              {this.state.error?.message || 'An unexpected error occurred in the Notes editor.'}
            </p>
            <Button onClick={this.handleReset} variant='outline'>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
