import { createContext, useContext, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  // Alert if Auth0 returns an error on redirect
  useEffect(() => {
    if (error) {
      console.error("Auth0 SDK Error:", error);
      alert(`Auth0 Error: ${error.message || error.error_description || "Authentication failed"}`);
    }
  }, [error]);

  // Normal Auth0 Universal Login
  const login = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          prompt: "login",
          redirect_uri: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Auth0 Login Error:", error);
      alert(`Auth0 Login Error: ${error.message}`);
    }
  };

  // Google login
  const googleLogin = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: "google-oauth2",
          prompt: "login",
          redirect_uri: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Google Login Error:", error);
      alert(`Google Login Error: ${error.message}`);
    }
  };

  // Auth0 Universal Hosted Signup
  const signupWithAuth0 = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: "signup",
          redirect_uri: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Auth0 Signup Error:", error);
      alert(`Auth0 Signup Error: ${error.message}`);
    }
  };

  // Signup with Auth0 database connection and sync to MongoDB
  const signup = async (email, password) => {
    const domain = process.env.REACT_APP_AUTH0_DOMAIN;
    const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

    // 1. Create user in Auth0
    const auth0Response = await fetch(`https://${domain}/dbconnections/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        email: email,
        password: password,
        connection: "Username-Password-Authentication",
      }),
    });

    const auth0Data = await auth0Response.json();

    if (!auth0Response.ok) {
      let errorMsg = "Auth0 signup failed";
      if (typeof auth0Data.description === "string") {
        errorMsg = auth0Data.description;
      } else if (auth0Data.policy) {
        errorMsg = `${auth0Data.message || "Password is too weak"}:\n${auth0Data.policy}`;
      } else if (typeof auth0Data.message === "string") {
        errorMsg = auth0Data.message;
      } else if (typeof auth0Data.error_description === "string") {
        errorMsg = auth0Data.error_description;
      }
      throw new Error(errorMsg);
    }

    return auth0Data;
  };

  // Logout
  const logout = () => {
    localStorage.setItem("post_logout_redirect", "true");
    sessionStorage.setItem("post_logout_redirect", "true");
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    googleLogin,
    signup,
    signupWithAuth0,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;