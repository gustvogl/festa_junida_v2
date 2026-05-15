import { useEffect, useState } from 'react';
import { FormField } from '../components/FormField';
import { Notice } from '../components/Notice';
import { PageScaffold } from '../components/PageScaffold';
import { useAuth } from '../context/AuthContext';
import { fetchLoveNotes, sendLoveNote } from '../lib/api';

export function MailPage() {
  const { setProfile } = useAuth();
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({
    recipientNickname: '',
    content: '',
    style: 'direct',
  });
  const [message, setMessage] = useState('');

  async function loadNotes() {
    try {
      setNotes(await fetchLoveNotes());
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const result = await sendLoveNote(form);
      if (typeof result.balance === 'number') {
        setProfile((current) => ({ ...current, tokens: result.balance }));
      }
      setMessage('Recadinho enviado.');
      setForm({ recipientNickname: '', content: '', style: 'direct' });
      await loadNotes();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageScaffold
      eyebrow="Correio"
      title="Correio do Amor"
      description="Envie recados reais para outros participantes. Mimos custam 1 ficha."
    >
      <div className="mail-layout">
        <form className="card form-card love-form" onSubmit={handleSubmit}>
          <div className="panel-ribbon">Novo recado</div>
          <FormField label="Para quem?">
            <input
              name="recipientNickname"
              value={form.recipientNickname}
              onChange={updateField}
              required
            />
          </FormField>
          <FormField label="Mensagem">
            <textarea name="content" value={form.content} onChange={updateField} required />
          </FormField>
          <FormField label="Estilo">
            <div className="choice-grid">
              {[
                ['direct', 'Direto'],
                ['anonymous', 'Anônimo'],
                ['mimo', 'Com mimo · -1 ficha'],
              ].map(([value, label]) => (
                <label key={value} className={form.style === value ? 'choice active' : 'choice'}>
                  <input
                    type="radio"
                    name="style"
                    value={value}
                    checked={form.style === value}
                    onChange={updateField}
                  />
                  {label}
                </label>
              ))}
            </div>
          </FormField>
          <button>Mandar correio</button>
        </form>

        <section className="card notes-panel love-notes">
          <div>
            <p className="eyebrow">Caixa postal</p>
            <h3>Últimos recados</h3>
          </div>
          <div className="stack">
            {notes.length ? (
              notes.map((note) => (
                <article key={note.id} className={`note ${note.style}`}>
                  <p>{note.content}</p>
                  <span>
                    {note.style === 'anonymous'
                      ? 'De: Anônimo'
                      : `De: ${note.sender?.nickname ?? 'Caipira'}`}
                  </span>
                </article>
              ))
            ) : (
              <p className="empty-state">Sua caixa postal ainda está silenciosa.</p>
            )}
          </div>
        </section>
      </div>

      <Notice>{message}</Notice>
    </PageScaffold>
  );
}
