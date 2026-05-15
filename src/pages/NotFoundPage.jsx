import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="auth-screen">
      <section className="auth-card card">
        <p className="eyebrow">Ops</p>
        <h1>Página não encontrada</h1>
        <Link to="/">Voltar para o arraial</Link>
      </section>
    </main>
  );
}
