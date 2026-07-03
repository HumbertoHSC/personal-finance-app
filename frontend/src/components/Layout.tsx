import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transactions', label: 'Transações', end: false },
  { to: '/categories', label: 'Categorias', end: false },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <span className="app-nav__brand">Finança Simples</span>
        <div className="app-nav__links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <span className="app-nav__user">{user?.name}</span>
        <button type="button" className="btn btn-secondary" onClick={() => logout()}>
          Sair
        </button>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
