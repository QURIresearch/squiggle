"use client";

import { Component, PropsWithChildren } from "react";

type State = {
  error?: Error;
};

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  public override state: State = {};

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch() {}

  public override render() {
    if (this.state.error) {
      return (
        <div className="mx-auto mt-4 max-w-2xl rounded-sm bg-red-400 p-4">
          <header className="mb-2">Error</header>
          <div className="mb-2">{this.state.error.message}</div>
          <pre className="overflow-auto text-xs">{this.state.error.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
