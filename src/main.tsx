/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContent } from './App';
import { SettingsProvider } from './context/SettingsContext';
import { DataProvider } from './context/DataContext';
import { DraftingProvider } from './context/DraftingContext';
import './index.css';

const isDev = (import.meta as any).env?.DEV ?? false;

// Xử lý Service Worker: Trong môi trường DEV thì gỡ bỏ hoàn toàn để không bao giờ bị kẹt cache
if ('serviceWorker' in navigator) {
  if (isDev) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  } else {
    // Môi trường Production (GitHub Pages / PWA): Tự động cập nhật bản mới
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((registration) => {
        registration.update();
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Có phiên bản mới, đang tải lại...');
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

