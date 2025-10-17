import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Import Heroicons CSS (if needed)
import '@heroicons/react/24/outline';

// Add missing import for onAuthStateChanged
import { onAuthStateChanged } from 'firebase/auth';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Make sure the onAuthStateChanged is available globally if needed
window.onAuthStateChanged = onAuthStateChanged;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);