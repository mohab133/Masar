import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initNativeApp } from './utils/nativePlugins.ts';
import './index.css';

function Root() {
  useEffect(() => {
    // Ensure standard light mode
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('fee_theme_preference');
    } catch {
      // Ignore
    }
    initNativeApp();
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);

