import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { buildArchive, archiveFileName, downloadJson } from "../lib/archive";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
  message: string;
}

const btn = {
  padding: "10px 18px", fontSize: 13, borderRadius: 6, cursor: "pointer",
  border: "1px solid #E3E3E3", background: "#fff", color: "#111",
} as const;

/** 화면을 그리다 오류가 나도 흰 화면 대신, 저장된 데이터를 내려받을 수 있는 복구 화면을 보여준다 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, message: "" };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  download = async () => {
    try {
      downloadJson(await buildArchive(), archiveFileName("_recovery"));
      this.setState({ message: "Your saved data was downloaded." });
    } catch {
      this.setState({ message: "Couldn't read the saved data." });
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 460, margin: "12vh auto", padding: 24, fontFamily: "inherit", color: "#111", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: "#757575", lineHeight: 1.7, marginBottom: 24 }}>
          Your saved data is still on this device. Download a copy first, then reload the page.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
          <button style={btn} onClick={this.download}>Download saved data</button>
          <button style={{ ...btn, background: "#111", color: "#fff", border: "1px solid #111" }} onClick={() => window.location.reload()}>Reload</button>
        </div>
        {this.state.message && <div style={{ fontSize: 12.5, color: "#757575", marginBottom: 14 }}>{this.state.message}</div>}
        <details style={{ fontSize: 11.5, color: "#757575", textAlign: "left" }}>
          <summary style={{ cursor: "pointer", textAlign: "center" }}>Error details</summary>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 10 }}>{String(this.state.error.message || this.state.error)}</pre>
        </details>
      </div>
    );
  }
}
