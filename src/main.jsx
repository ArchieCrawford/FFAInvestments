import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ThemeProvider } from "./ThemeProvider.jsx";

// Optional ErrorBoundary (if you want to keep it)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state || {};
      const stack =
        errorInfo && errorInfo.componentStack
          ? errorInfo.componentStack
          : null;

      return (
        <div
          style={{
            padding: "20px",
            background: "#ffe6e6",
            border: "2px solid red",
            margin: "20px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h2>🚨 Application Error</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            <summary>Error Details</summary>
            <p>
              <strong>Error:</strong> {error ? String(error) : "Unknown error"}
            </p>
            {stack ? (
              <>
                <p>
                  <strong>Stack:</strong>
                </p>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                  {stack}
                </pre>
              </>
            ) : (
              <p style={{ color: "#6b7280" }}>No stack trace available.</p>
            )}
          </details>
          <button onClick={() => window.location.reload()}>🔄 Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log("🚀 Starting FFA Investments application...");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);
