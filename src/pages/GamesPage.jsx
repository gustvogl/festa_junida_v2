import { useEffect, useState } from 'react';
import { Notice } from '../components/Notice';
import { PageScaffold } from '../components/PageScaffold';
import { useAuth } from '../context/AuthContext';
import { fetchGames, playGame } from '../lib/api';

export function GamesPage() {
  const { setProfile } = useAuth();
  const [games, setGames] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchGames().then(setGames).catch((error) => setMessage(error.message));
  }, []);

  async function handlePlay(gameKey) {
    try {
      const result = await playGame(gameKey);
      setProfile((current) => ({ ...current, tokens: result.balance }));
      setMessage(
        result.won
          ? `Você ganhou ${result.reward} fichas em ${result.game_name}!`
          : `Não foi dessa vez em ${result.game_name}.`,
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageScaffold
      eyebrow="Barracas"
      title="Jogos"
      description="Teste sua sorte nas brincadeiras do arraial e tente sair com mais fichas."
    >
      <Notice>{message}</Notice>

      <section className="cards-grid">
        {games.map((game) => (
          <article key={game.id} className="menu-card card">
            <span>{Math.round(game.win_chance * 100)}% de chance</span>
            <h3>{game.name}</h3>
            <p>{game.description}</p>
            <strong>
              Custo {game.cost} · prêmio {game.reward_tokens}
            </strong>
            <button onClick={() => handlePlay(game.game_key)}>Tentar a sorte</button>
          </article>
        ))}
      </section>
    </PageScaffold>
  );
}
