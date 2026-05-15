import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FestivalBunting } from '../components/FestivalBunting';
import { FormField } from '../components/FormField';
import { Notice } from '../components/Notice';
import { supabase } from '../lib/supabase';

const avatars = ['1', '2', '3', '4'];

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nickname: '',
    fullName: '',
    email: '',
    password: '',
    avatarId: '1',
  });
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

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nickname: form.nickname,
          full_name: form.fullName,
          avatar_id: form.avatarId,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      navigate('/');
      return;
    }

    setMessage('Cadastro criado. Verifique seu e-mail antes de entrar.');
    setLoading(false);
  }

  return (
    <main className="auth-screen">
      <section className="auth-stage">
        <FestivalBunting />
        <div className="auth-card auth-card-wide card">
          <div className="auth-emblem">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <p className="eyebrow">Registro do Caipira</p>
          <h1>Entrar na festança</h1>
          <p>Crie sua conta para usar fichas, correio e jogos de verdade.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-grid-two">
              <FormField label="Apelido caipira">
                <input name="nickname" value={form.nickname} onChange={updateField} required />
              </FormField>
              <FormField label="Nome real">
                <input name="fullName" value={form.fullName} onChange={updateField} required />
              </FormField>
              <FormField label="E-mail">
                <input name="email" type="email" value={form.email} onChange={updateField} required />
              </FormField>
              <FormField label="Senha">
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={updateField}
                  required
                />
              </FormField>
            </div>

            <div className="field avatar-field">
              <span>Escolha seu rosto</span>
              <div className="avatar-picker">
                {avatars.map((avatar) => (
                  <label key={avatar}>
                    <input
                      type="radio"
                      name="avatarId"
                      value={avatar}
                      checked={form.avatarId === avatar}
                      onChange={updateField}
                    />
                    <span>{avatar}</span>
                  </label>
                ))}
              </div>
            </div>

            <button disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
          </form>

          <Notice tone="info">{message}</Notice>

          <p className="auth-switch">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
