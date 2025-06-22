
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Use the existing ErrorBoundary instead of SentryErrorBoundary to avoid CommonJS issues
import ErrorBoundary from './components/ErrorBoundary';
import './services/sentryService';

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
