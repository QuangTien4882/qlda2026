import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContent } from './App';
import { SettingsProvider } from './context/SettingsContext';
import { DataProvider } from './context/DataContext';
import { DraftingProvider } from './context/DraftingContext';
import './index.css';

// Register PWA Service Worker & auto-update when new version is available
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      registration.update();
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version ready, reloading...');
              window.location.reload();
            }
          };
        }
      };
    }).catch((err) => {
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

