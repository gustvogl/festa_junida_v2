import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FestivalBunting } from '../components/FestivalBunting';
import { FormField } from '../components/FormField';
import { Notice } from '../components/Notice';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    navigate('/');
  }

  return (
    <main className="auth-screen">
      <section className="auth-stage">
        <FestivalBunting />
        <div className="auth-card card">
          <div className="auth-emblem">
            <span className="material-symbols-outlined">local_fire_department</span>
          </div>
          <p className="eyebrow">Arraiá Digital</p>
          <h1>Puxe uma cadeira</h1>
          <p>Entre para continuar sua festa.</p>

          <form onSubmit={handleSubmit}>
            <FormField label="E-mail">
              <input name="email" type="email" value={form.email} onChange={updateField} required />
            </FormField>
            <FormField label="Senha">
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                required
              />
            </FormField>
            <button disabled={loading}>{loading ? 'Entrando...' : 'Entrar na festança'}</button>
          </form>

          <Notice tone="danger">{message}</Notice>

          <p className="auth-switch">
            Ainda não tem conta? <Link to="/cadastro">Cadastrar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
