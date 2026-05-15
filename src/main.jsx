import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import './styles.css';

function SetupRequired() {
  return (
    <main className="auth-screen">
      <section className="auth-card card">
        <p className="eyebrow">Configuração pendente</p>
        <h1>Conecte o Supabase</h1>
        <p>
          Preencha <code>.env</code> com <code>VITE_SUPABASE_URL</code> e{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> para ativar o app real.
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSupabaseConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <SetupRequired />
    )}
  </React.StrictMode>,
);
