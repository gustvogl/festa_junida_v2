import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageScaffold } from '../components/PageScaffold';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { fetchShows } from '../lib/api';

const quickLinks = [
  { to: '/comidas', title: 'Comidas', description: 'Comprar quitutes com fichas', icon: 'restaurant' },
  { to: '/correio', title: 'Correio do Amor', description: 'Mandar recadinhos', icon: 'favorite' },
  { to: '/jogos', title: 'Jogos', description: 'Ganhar ou gastar fichas', icon: 'attractions' },
  { to: '/prisao', title: 'Prisão', description: 'Prender amigos no xadrez', icon: 'lock' },
  { to: '/shows', title: 'Shows', description: 'Ver a programação', icon: 'music_note' },
  { to: '/vidente', title: 'Vidente', description: 'Consultar os astros', icon: 'visibility' },
];

export function HomePage() {
  const { profile } = useAuth();
  const [highlight, setHighlight] = useState(null);

  useEffect(() => {
    fetchShows()
      .then((shows) => setHighlight(shows.find((show) => show.is_live) ?? shows[0] ?? null))
      .catch(() => setHighlight(null));
  }, []);

  return (
    <PageScaffold
      eyebrow="Bem-vindo(a)"
      title={`Olá, ${profile?.nickname ?? 'caipira'}!`}
      description="Pegue seu chapéu de palha: o arraial agora tem fichas, correio e barracas funcionando de verdade."
    >
      <section className="stats-grid">
        <StatCard label="Fichas" value={profile?.tokens ?? 0} tone="gold" />
        <StatCard label="Nível" value={profile?.level ?? 'Caipira iniciante'} />
        <StatCard label="Perfil" value={profile?.role === 'admin' ? 'Administrador' : 'Participante'} />
      </section>

      {highlight && (
        <section className="standard-highlight card">
          <span className="material-symbols-outlined">music_note</span>
          <div>
            <span>{highlight.is_live ? 'Ao vivo agora' : 'Próximo no palco'}</span>
            <h3>{highlight.title}</h3>
            <p>{highlight.artist}</p>
          </div>
          <Link to="/shows">Ver programação</Link>
        </section>
      )}

      <section className="feature-grid">
        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to} className="feature-card card">
            <span className="material-symbols-outlined">{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Link>
        ))}
      </section>
    </PageScaffold>
  );
}
