import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FestivalBunting } from './FestivalBunting';

const navItems = [
  { to: '/', label: 'Início', icon: 'home' },
  { to: '/comidas', label: 'Comidas', icon: 'restaurant' },
  { to: '/correio', label: 'Correio', icon: 'mail' },
  { to: '/jogos', label: 'Jogos', icon: 'storefront' },
  { to: '/shows', label: 'Shows', icon: 'event' },
  { to: '/prisao', label: 'Prisão', icon: 'lock' },
  { to: '/vidente', label: 'Vidente', icon: 'psychology' },
  { to: '/perfil', label: 'Perfil', icon: 'person' },
];

export function Layout() {
  const { profile, signOut } = useAuth();
  const mobileItems = navItems.filter((item) =>
    ['/', '/jogos', '/correio', '/comidas', '/perfil'].includes(item.to),
  );

  return (
    <div className="app-shell">
      <aside className="sidebar card">
        <div>
          <p className="eyebrow">Arraiá Digital</p>
          <h1>Festa Junina</h1>
        </div>

        <div className="profile-chip">
          <div className="avatar">{profile?.avatar_id ?? '1'}</div>
          <div>
            <strong>{profile?.nickname ?? 'Caipira'}</strong>
            <span>{profile?.tokens ?? 0} fichas</span>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {profile?.role === 'admin' && (
            <NavLink to="/admin">
              <span className="material-symbols-outlined">settings</span>
              Admin
            </NavLink>
          )}
        </nav>

        <button className="ghost-button" onClick={signOut}>
          Sair
        </button>
      </aside>

      <main className="content">
        <header className="mobile-header card">
          <div>
            <p className="eyebrow">Arraiá Digital</p>
            <strong>{profile?.nickname}</strong>
          </div>
          <span className="token-pill">
            <span className="material-symbols-outlined">toll</span>
            {profile?.tokens ?? 0}
          </span>
        </header>
        <FestivalBunting compact />
        <Outlet />
      </main>

      <nav className="bottom-nav card">
        {mobileItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <small>{item.label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
