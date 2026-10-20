import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/plus-jakarta-sans';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/components.css';
import './styles/pages.css';
import App from './App.jsx';
import { AuthProvider } from './context/Auth.jsx';
import { ToastProvider } from './components/Toast.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
