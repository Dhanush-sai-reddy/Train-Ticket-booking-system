import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: 'red', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    <h1>Something went wrong.</h1>
                    <h3>{this.state.error?.toString()}</h3>
                    <p>{this.state.errorInfo?.componentStack}</p>
                </div>
            );
        }

        return this.props.children;
    }
}

try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </React.StrictMode>
    );
    console.log("React app mounted successfully.");
} catch (error) {
    console.error("Error mounting React app:", error);
    document.body.innerHTML = `<h1>Mount Error</h1><pre>${error}</pre>`;
}