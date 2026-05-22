import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID?.trim();

if (!GOOGLE_CLIENT_ID) {
  document.getElementById('root')!.innerHTML = `
    <div style="padding:2rem;text-align:center;color:#fff;background:#1a1a2e;min-height:100vh;font-family:sans-serif;">
      <h1>Configuración incomplete</h1>
      <p>Falta la variable de entorno <code>GOOGLE_CLIENT_ID</code> en Vercel.</p>
      <p>Agregala en: Vercel Dashboard → Settings → Environment Variables</p>
    </div>
  `;
  throw new Error('Missing GOOGLE_CLIENT_ID');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);
