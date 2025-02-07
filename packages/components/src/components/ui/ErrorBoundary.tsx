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
        <div className="m-2 rounded-sm bg-red-300 p-4">
          <header className="mb-2 font-semibold">Fatal Error</header>
          <div className="mb-2">{this.state.error.message}</div>
          <div className="mb-2">Try reloading the browser.</div>
          <pre className="overflow-auto text-xs">{this.state.error.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
