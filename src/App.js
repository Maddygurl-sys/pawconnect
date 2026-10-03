import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';

function HomeRoute() {
  const isPostLogout =
    localStorage.getItem("post_logout_redirect") ||
    sessionStorage.getItem("post_logout_redirect");

  if (isPostLogout) {
    localStorage.removeItem("post_logout_redirect");
    sessionStorage.removeItem("post_logout_redirect");
    return <Navigate to="/login" replace />;
  }

  return <Home />;
}

function LogoutRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (
      localStorage.getItem("post_logout_redirect") ||
      sessionStorage.getItem("post_logout_redirect")
    ) {
      localStorage.removeItem("post_logout_redirect");
      sessionStorage.removeItem("post_logout_redirect");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <LogoutRedirectHandler />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/home" element={<HomeRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/add-pet" element={<AddPet />} />
        <Route path="/addpet" element={<AddPet />} />
        <Route path="/edit-pet/:firebaseId" element={<EditPet />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;