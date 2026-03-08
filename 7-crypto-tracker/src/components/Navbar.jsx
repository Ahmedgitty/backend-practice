import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        ⬡ CRYPTEX_TERMINAL
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-user">
              OPERATOR: <span>{user.username || `ID:${user.id}`}</span>
            </span>
            <button className="nav-logout-btn" onClick={handleLogout}>
              ⏻ Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
