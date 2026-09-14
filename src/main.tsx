import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initNativeApp } from './utils/nativePlugins';
import { registerWebServiceWorker } from './utils/serviceWorker';

// Masar uses in-app dialogs only. Prevent WebView-native JavaScript dialogs
// from appearing above the app UI (especially after form/API failures).
const nativeWindow = window as Window & {
  __masarDialogsBlocked?: boolean;
};

if (!nativeWindow.__masarDialogsBlocked) {
  nativeWindow.__masarDialogsBlocked = true;
  window.alert = () => undefined;
  window.confirm = () => false;
  window.prompt = () => null;
}

void initNativeApp();
registerWebServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
