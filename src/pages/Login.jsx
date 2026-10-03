import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login, googleLogin, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "80px",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "380px",
        margin: "100px auto",
        textAlign: "center",
      }}
    >
      <h1>PawConnect Login</h1>

      <button
        onClick={login}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: "20px",
          marginBottom: "12px",
          backgroundColor: "#123f49",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Login with Auth0
      </button>

      <button
        onClick={googleLogin}
        style={{
          width: "100%",
          padding: "14px",
          marginBottom: "20px",
          backgroundColor: "white",
          color: "#333",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Continue with Google
      </button>

      <p>
        Don't have an account?{" "}
        <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
}

export default Login;