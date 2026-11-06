import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error(err); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="card max-w-sm p-8 text-center">
          <h1 className="text-xl font-bold">Something broke</h1>
          <p className="mt-2 text-sm text-muted">An unexpected error occurred. Reloading usually fixes it.</p>
          <button className="btn-primary mt-6" onClick={() => window.location.assign("/dashboard")}>Reload app</button>
        </div>
      </div>
    );
  }
}
