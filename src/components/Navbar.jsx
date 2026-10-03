import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="navbar">
      <div className="logo">
        🐾 PawConnect
      </div>

      <div className="menu">
        <Link to="/home">Home</Link>

        <Link to="/addpet">Add Pet</Link>

        <button
          style={{ marginLeft: "20px" }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;