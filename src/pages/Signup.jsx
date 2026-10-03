import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const { signup, signupWithAuth0, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e) {
    e.preventDefault();

    try {
      await signup(email, password);

      alert("Account Created Successfully! Redirecting to secure Auth0 login...");

      await login();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div
      style={{
        width: "350px",
        margin: "80px auto",
        textAlign: "center",
      }}
    >
      <h1>Create Account</h1>

      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#123f49",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
      </form>

      <div style={{ margin: "15px 0", color: "#666" }}>or</div>

      <button
        type="button"
        onClick={signupWithAuth0}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "white",
          color: "#333",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Sign Up with Auth0
      </button>

      <p style={{ marginTop: "20px" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Signup;