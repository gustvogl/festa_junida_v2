import { useEffect, useMemo, useState } from 'react';
import { Notice } from '../components/Notice';
import { PageScaffold } from '../components/PageScaffold';
import { useAuth } from '../context/AuthContext';
import { fetchMenuItems, purchaseMenuItems } from '../lib/api';

export function FoodPage() {
  const { profile, setProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todos');

  useEffect(() => {
    fetchMenuItems()
      .then(setItems)
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const cartLines = useMemo(
    () =>
      items
        .filter((item) => cart[item.id])
        .map((item) => ({ ...item, quantity: cart[item.id] })),
    [cart, items],
  );

  const total = cartLines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const categories = ['Todos', ...new Set(items.map((item) => item.category))];
  const visibleItems =
    category === 'Todos' ? items : items.filter((item) => item.category === category);

  function addToCart(itemId) {
    setCart((current) => ({ ...current, [itemId]: (current[itemId] ?? 0) + 1 }));
  }

  function updateQuantity(itemId, delta) {
    setCart((current) => {
      const nextQuantity = (current[itemId] ?? 0) + delta;
      if (nextQuantity <= 0) {
        const { [itemId]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [itemId]: nextQuantity };
    });
  }

  async function checkout() {
    try {
      const result = await purchaseMenuItems(
        cartLines.map((item) => ({ menu_item_id: item.id, quantity: item.quantity })),
      );
      setProfile((current) => ({ ...current, tokens: result.balance }));
      setCart({});
      setMessage(`Pedido confirmado. Total: ${result.total} fichas.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageScaffold
      eyebrow="Barraca"
      title="Comidas"
      description="Escolha suas delícias, monte o pedido e pague com suas fichas."
    >
      <Notice>{message}</Notice>

      <section className="food-toolbar card">
        <div>
          <p className="eyebrow">Cardápio</p>
          <strong>Escolha suas delícias</strong>
        </div>
        <div className="chip-row">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? 'chip active' : 'chip'}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p>Carregando cardápio...</p>
      ) : (
        <section className="cards-grid">
          {visibleItems.map((item) => (
            <article key={item.id} className="menu-card card">
              <div className="food-stamp">
                <span className="material-symbols-outlined">restaurant</span>
              </div>
              <span>{item.category}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <strong>{item.price} fichas</strong>
              {cart[item.id] ? (
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <strong>{cart[item.id]}</strong>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
              ) : (
                <button onClick={() => addToCart(item.id)}>Adicionar</button>
              )}
            </article>
          ))}
        </section>
      )}

      <section className="checkout card">
        <div>
          <strong>
            {cartLines.reduce((sum, item) => sum + item.quantity, 0)} itens no carrinho
          </strong>
          <span>Total: {total} fichas</span>
        </div>
        <button onClick={checkout} disabled={!cartLines.length || total > (profile?.tokens ?? 0)}>
          Pagar agora
        </button>
      </section>
    </PageScaffold>
  );
}
