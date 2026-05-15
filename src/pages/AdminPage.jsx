import { useEffect, useState } from 'react';
import { FormField } from '../components/FormField';
import { Notice } from '../components/Notice';
import { PageScaffold } from '../components/PageScaffold';
import { useAuth } from '../context/AuthContext';
import { fetchAdminCollections, saveMenuItem, saveShow } from '../lib/api';

const emptyMenuItem = {
  name: '',
  description: '',
  category: 'Salgados',
  price: 1,
  image_url: '',
  active: true,
};

const emptyShow = {
  title: '',
  artist: '',
  description: '',
  starts_at: '',
  ends_at: '',
  is_live: false,
};

export function AdminPage() {
  const { profile } = useAuth();
  const [menuItem, setMenuItem] = useState(emptyMenuItem);
  const [show, setShow] = useState(emptyShow);
  const [data, setData] = useState({ menuItems: [], shows: [] });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAdminCollections().then(setData).catch((error) => setMessage(error.message));
  }, []);

  if (profile?.role !== 'admin') {
    return <Notice tone="danger">Acesso restrito à organização.</Notice>;
  }

  async function handleMenuSubmit(event) {
    event.preventDefault();
    try {
      const saved = await saveMenuItem(menuItem);
      setData((current) => ({ ...current, menuItems: [...current.menuItems, saved] }));
      setMenuItem(emptyMenuItem);
      setMessage('Item salvo.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleShowSubmit(event) {
    event.preventDefault();
    try {
      const saved = await saveShow(show);
      setData((current) => ({ ...current, shows: [...current.shows, saved] }));
      setShow(emptyShow);
      setMessage('Show salvo.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageScaffold
      eyebrow="Organização"
      title="Admin"
      description="Painel mínimo para editar cardápio e programação."
    >
      <div className="grid-two">
        <form className="card form-card" onSubmit={handleMenuSubmit}>
          <h3>Novo item</h3>
          <FormField label="Nome">
            <input
              value={menuItem.name}
              onChange={(event) => setMenuItem((current) => ({ ...current, name: event.target.value }))}
            />
          </FormField>
          <FormField label="Descrição">
            <textarea
              value={menuItem.description}
              onChange={(event) =>
                setMenuItem((current) => ({ ...current, description: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Categoria">
            <input
              value={menuItem.category}
              onChange={(event) =>
                setMenuItem((current) => ({ ...current, category: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Preço">
            <input
              type="number"
              value={menuItem.price}
              onChange={(event) =>
                setMenuItem((current) => ({ ...current, price: Number(event.target.value) }))
              }
            />
          </FormField>
          <button>Salvar item</button>
        </form>

        <form className="card form-card" onSubmit={handleShowSubmit}>
          <h3>Novo show</h3>
          <FormField label="Título">
            <input
              value={show.title}
              onChange={(event) => setShow((current) => ({ ...current, title: event.target.value }))}
            />
          </FormField>
          <FormField label="Artista">
            <input
              value={show.artist}
              onChange={(event) => setShow((current) => ({ ...current, artist: event.target.value }))}
            />
          </FormField>
          <FormField label="Início">
            <input
              type="datetime-local"
              value={show.starts_at}
              onChange={(event) =>
                setShow((current) => ({ ...current, starts_at: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Fim">
            <input
              type="datetime-local"
              value={show.ends_at}
              onChange={(event) =>
                setShow((current) => ({ ...current, ends_at: event.target.value }))
              }
            />
          </FormField>
          <button>Salvar show</button>
        </form>
      </div>

      <Notice>{message}</Notice>

      <div className="grid-two">
        <section className="card notes-panel">
          <h3>Itens cadastrados</h3>
          <div className="stack">
            {data.menuItems.map((item) => (
              <article key={item.id} className="note">
                <p>{item.name}</p>
                <span>{item.price} fichas</span>
              </article>
            ))}
          </div>
        </section>
        <section className="card notes-panel">
          <h3>Shows cadastrados</h3>
          <div className="stack">
            {data.shows.map((item) => (
              <article key={item.id} className="note">
                <p>{item.title}</p>
                <span>{item.artist}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageScaffold>
  );
}
