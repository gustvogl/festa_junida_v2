import { useEffect, useState } from 'react';
import { FormField } from '../components/FormField';
import { Notice } from '../components/Notice';
import { PageScaffold } from '../components/PageScaffold';
import { useAuth } from '../context/AuthContext';
import { fetchTokenTransactions, updateOwnProfile } from '../lib/api';

export function ProfilePage() {
  const { profile, setProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: profile?.full_name ?? '',
    nickname: profile?.nickname ?? '',
    avatarId: profile?.avatar_id ?? '1',
  });
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      fullName: profile?.full_name ?? '',
      nickname: profile?.nickname ?? '',
      avatarId: profile?.avatar_id ?? '1',
    });
  }, [profile]);

  useEffect(() => {
    fetchTokenTransactions().then(setTransactions).catch(() => setTransactions([]));
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const result = await updateOwnProfile(form);
      setProfile(result);
      setMessage('Perfil atualizado.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageScaffold
      eyebrow="Conta"
      title="Meu perfil"
      description="Cuide do seu cadastro e acompanhe por onde suas fichas andaram."
    >
      <div className="grid-two">
        <form className="card form-card" onSubmit={handleSubmit}>
          <FormField label="Nome completo">
            <input name="fullName" value={form.fullName} onChange={updateField} />
          </FormField>
          <FormField label="Apelido">
            <input name="nickname" value={form.nickname} onChange={updateField} />
          </FormField>
          <FormField label="Avatar">
            <input name="avatarId" value={form.avatarId} onChange={updateField} />
          </FormField>
          <button>Salvar perfil</button>
        </form>

        <section className="card notes-panel">
          <h3>Últimas fichas</h3>
          <div className="stack">
            {transactions.length ? (
              transactions.map((transaction) => (
                <article key={transaction.id} className="note">
                  <p>{transaction.reason}</p>
                  <span>{transaction.delta > 0 ? '+' : ''}{transaction.delta} fichas</span>
                </article>
              ))
            ) : (
              <p className="empty-state">Nenhuma movimentação ainda.</p>
            )}
          </div>
        </section>
      </div>

      <Notice>{message}</Notice>
    </PageScaffold>
  );
}
