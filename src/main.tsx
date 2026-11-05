import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContent } from './App';
import { SettingsProvider } from './context/SettingsContext';
import { DataProvider } from './context/DataContext';
import { DraftingProvider } from './context/DraftingContext';
import './index.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] ServiceWorker registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <DataProvider>
        <DraftingProvider>
          <AppContent />
        </DraftingProvider>
      </DataProvider>
    </SettingsProvider>
  </React.StrictMode>
);

