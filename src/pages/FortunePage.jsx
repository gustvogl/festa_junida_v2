import { useState } from 'react';
import { PageScaffold } from '../components/PageScaffold';

const responses = [
  'Santo Antônio sorriu para você hoje.',
  'A sorte vem com cheiro de milho assado.',
  'A fogueira esquenta o caminho, mas escolha bem quem acompanha.',
  'Tem surpresa boa esperando perto das bandeirinhas.',
  'Seu coração já sabe a resposta; só falta coragem.',
];

export function FortunePage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('Pergunte algo para a vidente.');

  function reveal() {
    if (!question.trim()) return;
    const index = Math.floor(Math.random() * responses.length);
    setAnswer(responses[index]);
  }

  return (
    <PageScaffold
      eyebrow="Tenda"
      title="Vidente"
      description="Faça sua pergunta e deixe a sorte brincar um pouco com o seu São João."
    >
      <section className="fortune card">
        <div className="crystal-ball">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Qual é o seu desejo pro São João?"
        />
        <button onClick={reveal}>Consultar</button>
        <blockquote>{answer}</blockquote>
      </section>
    </PageScaffold>
  );
}
