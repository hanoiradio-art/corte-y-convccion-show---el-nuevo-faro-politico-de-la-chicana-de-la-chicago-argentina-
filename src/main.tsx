import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register the official PWA Service Worker so Android/Desktop recognize the app as installable
registerSW({
  immediate: true,
  onRegisterError(error) {
    console.warn('[PWA] Error registrando Service Worker:', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
