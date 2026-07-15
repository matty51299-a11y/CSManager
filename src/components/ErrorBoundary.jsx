import { Component } from 'react';

function isDevelopment() {
  return import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production';
}

function currentRoute() {
  if (typeof window === 'undefined') return 'unknown';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (isDevelopment()) {
      console.error('CSManager runtime error', {
        message: error?.message,
        stack: error?.stack,
        componentStack: info?.componentStack,
        route: currentRoute(),
        currentCareerDate: this.props.currentCareerDate || 'unknown',
      });
      return;
    }

    console.error('CSManager runtime error:', error?.message || error);
  }

  handleReset = () => {
    if (this.props.onReset) this.props.onReset();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="error-panel">
        <h1>Something went wrong</h1>
        <p className="muted">The app hit a runtime error instead of crashing to a blank screen.</p>
        <pre className="error-detail">{error.message}</pre>
        <div className="action-row">
          <button onClick={() => this.setState({ error: null })}>Try to recover</button>
          <button className="ghost-button" onClick={this.handleReset}>Reset career &amp; reload</button>
        </div>
      </div>
    );
  }
}
