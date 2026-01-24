import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Starting RailRover Frontend...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}
console.log("Root element found. Mounting React app...");

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React app mounted successfully.");
} catch (error) {
  console.error("Error mounting React app:", error);
}