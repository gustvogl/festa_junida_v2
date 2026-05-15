import { useEffect, useState } from 'react';
import { FormField } from '../components/FormField';
import { Notice } from '../components/Notice';
import { PageScaffold } from '../components/PageScaffold';
import { useAuth } from '../context/AuthContext';
import { answerJailQuiz, fetchJailRecords, jailUser, payBail } from '../lib/api';

export function JailPage() {
  const { setProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [answer, setAnswer] = useState('');
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState('');

  async function loadRecords() {
    setRecords(await fetchJailRecords());
  }

  useEffect(() => {
    loadRecords().catch((error) => setMessage(error.message));
  }, []);

  async function handleJail(event) {
    event.preventDefault();
    try {
      const result = await jailUser(nickname);
      setProfile((current) => ({ ...current, tokens: result.balance }));
      setNickname('');
      setMessage(`${result.prisoner_nickname} foi para o xadrez.`);
      await loadRecords();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleBail() {
    try {
      const result = await payBail();
      setProfile((current) => ({ ...current, tokens: result.balance }));
      setMessage('Fiança paga. Você está livre.');
      await loadRecords();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleQuiz() {
    try {
      const result = await answerJailQuiz(answer);
      if (result.correct) {
        setProfile((current) => ({ ...current, tokens: result.balance }));
        setMessage('Acertou o quiz. Você saiu do xadrez e ganhou 2 fichas.');
        await loadRecords();
      } else {
        setMessage('Resposta errada. A polícia do arraial continua de olho.');
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageScaffold
      eyebrow="Xadrez"
      title="Prisão"
      description="Prender alguém custa 2 fichas. Sair pode custar 1 ficha ou uma boa resposta."
    >
      <div className="grid-two">
        <form className="card form-card jail-form" onSubmit={handleJail}>
          <h3>Mandar prender</h3>
          <FormField label="Apelido">
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} required />
          </FormField>
          <button>Prender agora</button>
        </form>

        <section className="card notes-panel jail-panel">
          <h3>Quem está preso</h3>
          <div className="stack">
            {records.length ? (
              records.map((record) => (
                <article key={record.id} className="note prisoner-note">
                  <p>@{record.prisoner?.nickname}</p>
                  <span>Preso por @{record.jailed_by?.nickname}</span>
                </article>
              ))
            ) : (
              <p className="empty-state">O xadrez está vazio por enquanto.</p>
            )}
          </div>
        </section>
      </div>

      <section className="card release-card">
        <h3>Tá no xadrez?</h3>
        <div className="release-actions">
          <button onClick={handleBail}>Pagar fiança</button>
          <input
            placeholder="Qual tradição junina você lembra?"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <button onClick={handleQuiz}>Responder quiz</button>
        </div>
      </section>

      <Notice>{message}</Notice>
    </PageScaffold>
  );
}
