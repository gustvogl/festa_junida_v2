import { useEffect, useState } from 'react';
import { PageScaffold } from '../components/PageScaffold';
import { fetchShows } from '../lib/api';

export function ShowsPage() {
  const [shows, setShows] = useState([]);
  const liveShow = shows.find((show) => show.is_live);

  useEffect(() => {
    fetchShows().then(setShows);
  }, []);

  return (
    <PageScaffold
      eyebrow="Palco"
      title="Programação"
      description="Veja quem já passou pelo palco, quem está tocando e o que ainda vem por aí."
    >
      {liveShow && (
        <section className="standard-highlight card">
          <span className="material-symbols-outlined">music_note</span>
          <div>
            <span>Ao vivo agora</span>
            <h3>{liveShow.title}</h3>
            <p>{liveShow.artist}</p>
          </div>
          <button>Assistir</button>
        </section>
      )}

      <section className="timeline card">
        {shows.length ? (
          shows.map((show) => (
            <article key={show.id}>
              <time>{new Date(show.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
              <div>
                <h3>{show.title}</h3>
                <p>{show.artist}</p>
              </div>
              {show.is_live && <strong>Ao vivo</strong>}
            </article>
          ))
        ) : (
          <p className="empty-state">A programação ainda não foi publicada.</p>
        )}
      </section>
    </PageScaffold>
  );
}
