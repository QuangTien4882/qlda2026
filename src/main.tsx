import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContent } from './App';
import { SettingsProvider } from './context/SettingsContext';
import { DataProvider } from './context/DataContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </SettingsProvider>
  </React.StrictMode>
);

