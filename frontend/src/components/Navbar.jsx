import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link className="brand" to={isAuthenticated ? '/dashboard' : '/login'}>
        TaskFlow
      </Link>
      {isAuthenticated && (
        <nav>
          <span>Hi, {user.name}</span>
          <button type="button" onClick={handleLogout}>Log out</button>
        </nav>
      )}
    </header>
  );
}
