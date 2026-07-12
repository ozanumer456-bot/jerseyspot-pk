import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const RECOVERY_KEY = "kitverse-max-depth-recovery";

function isMaximumUpdateDepthError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("maximum update depth exceeded");
}

type Props = { children: ReactNode };
type State = { error: Error | null; recovering: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, recovering: false };

  static getDerivedStateFromError(error: Error): State {
    return { error, recovering: isMaximumUpdateDepthError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary] caught error", { message: error.message, stack: info.componentStack });

    if (!isMaximumUpdateDepthError(error) || typeof window === "undefined") return;

    const alreadyRecovered = window.sessionStorage.getItem(RECOVERY_KEY) === "1";
    if (alreadyRecovered) return;

    window.sessionStorage.setItem(RECOVERY_KEY, "1");
    window.setTimeout(() => window.location.reload(), 50);
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (prevState.error && !this.state.error && typeof window !== "undefined") {
      window.sessionStorage.removeItem(RECOVERY_KEY);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen grid place-items-center bg-background p-6 text-foreground">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-2xl">K</div>
          <h1 className="font-display text-3xl">Refreshing your store</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.recovering ? "We detected a temporary loading issue and are restoring the page." : "Something went wrong while loading this page."}
          </p>
          <Button className="mt-6 bg-primary text-primary-foreground" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}