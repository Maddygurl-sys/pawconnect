import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { deletePetFromMongo, adoptPetInMongo } from "../services/petService";

function Home() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      localStorage.getItem("post_logout_redirect") ||
      sessionStorage.getItem("post_logout_redirect")
    ) {
      localStorage.removeItem("post_logout_redirect");
      sessionStorage.removeItem("post_logout_redirect");
      navigate("/login", { replace: true });
      return;
    }
    getPets();
  }, [navigate]);

  async function getPets() {
    try {
      const querySnapshot = await getDocs(collection(db, "pets"));

      const petList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPets(petList);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleLogout() {
    await logout();
  }

  async function handleAdopt(pet) {
    if (!isAuthenticated) {
      alert("Please login first to adopt a pet!");
      navigate("/login");
      return;
    }

    try {
      const adoptionData = {
        isAdopted: true,
        adoptedBy: user?.email || user?.name || "Adopter",
        adoptedAt: new Date().toISOString(),
      };

      // 1. Update in Firebase Firestore
      await updateDoc(doc(db, "pets", pet.id), adoptionData);

      // 2. Update in MongoDB
      await adoptPetInMongo(pet.id, adoptionData.adoptedBy, adoptionData.adoptedAt);

      // 3. Update local state
      const updatedPet = { ...pet, ...adoptionData };
      setPets((prev) =>
        prev.map((p) => (p.id === pet.id ? updatedPet : p))
      );
      setSelectedPet(updatedPet);

      alert(`🎉 Congratulations! You have successfully adopted ${pet.petName}`);
    } catch (error) {
      console.error("Error adopting pet:", error);
      alert(`Failed to adopt pet: ${error.message}`);
    }
  }

  async function handleDelete(firebaseId) {
    if (!window.confirm("Are you sure you want to delete this pet?")) {
      return;
    }

    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, "pets", firebaseId));

      // 2. Delete from MongoDB (handles Dropbox image deletion too)
      await deletePetFromMongo(firebaseId);

      alert("Pet deleted successfully from Firestore, MongoDB, and Dropbox!");

      // Update state
      setPets(pets.filter((p) => p.id !== firebaseId));
      setSelectedPet(null);
    } catch (error) {
      console.error("Error deleting pet:", error);
      alert(`Failed to delete pet: ${error.message}`);
    }
  }

  return (
    <div style={{ background: "#eef3f7", minHeight: "100vh" }}>
      {/* Navbar */}
      <div
        style={{
          background: "#0f3b46",
          color: "white",
          padding: "15px 25px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>🐾 PawConnect</h2>

        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link to="/" style={navLink}>Home</Link>
          <Link to="/add-pet" style={navLink}>Add Pet</Link>

          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#e0f2fe", fontWeight: "bold" }}>
                👤 {user?.email || user?.name}
              </span>
              <button onClick={handleLogout} style={logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" style={navLink}>Login</Link>
          )}
        </div>
      </div>

      <div style={{ padding: "30px 40px" }}>
        <h2>Available Pets</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          {pets.map((pet) => (
            <div key={pet.id} style={card}>
              <img
                src={pet.imageUrl}
                alt={pet.petName}
                style={cardImg}
              />

              <h3>{pet.petName}</h3>
              <p><b>Breed:</b> {pet.breed}</p>
              <p><b>Age:</b> {pet.age}</p>
              <p><b>Location:</b> {pet.location}</p>
              <p>
                <b>Status:</b>{" "}
                {pet.isAdopted ? (
                  <span style={{ color: "#16a34a", fontWeight: "bold" }}>Adopted</span>
                ) : (
                  <span style={{ color: "#2563eb", fontWeight: "bold" }}>Available</span>
                )}
              </p>

              <button
                onClick={() => setSelectedPet(pet)}
                style={viewBtn}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedPet && (
        <div style={overlay}>
          <div style={modal}>
            <img
              src={selectedPet.imageUrl}
              alt={selectedPet.petName}
              style={modalImg}
            />

            <h2>{selectedPet.petName}</h2>

            <p><b>Breed:</b> {selectedPet.breed}</p>
            <p><b>Age:</b> {selectedPet.age}</p>
            <p><b>Gender:</b> {selectedPet.gender}</p>
            <p><b>Location:</b> {selectedPet.location}</p>
            <p><b>Description:</b> {selectedPet.description}</p>
            <p><b>Contact:</b> {selectedPet.contact}</p>
            <p>
              <b>Status:</b>{" "}
              {selectedPet.isAdopted ? (
                <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                  Adopted {selectedPet.adoptedBy ? `by ${selectedPet.adoptedBy}` : ""}
                </span>
              ) : (
                <span style={{ color: "#2563eb", fontWeight: "bold" }}>Available</span>
              )}
            </p>

            <div style={{ marginTop: "20px" }}>
              {selectedPet.isAdopted ? (
                <button
                  style={{ ...adoptBtn, background: "#9ca3af", cursor: "not-allowed" }}
                  disabled
                >
                  Already Adopted
                </button>
              ) : (
                <button
                  style={adoptBtn}
                  onClick={() => handleAdopt(selectedPet)}
                >
                  Adopt
                </button>
              )}

              {isAuthenticated && (
                <>
                  <button
                    style={editBtn}
                    onClick={() => {
                      navigate(`/edit-pet/${selectedPet.id}`);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    style={deleteBtn}
                    onClick={() => handleDelete(selectedPet.id)}
                  >
                    Delete
                  </button>
                </>
              )}

              <button
                style={closeBtn}
                onClick={() => setSelectedPet(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navLink = {
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
};

const logoutBtn = {
  background: "#4da6ff",
  border: "none",
  color: "white",
  padding: "8px 14px",
  borderRadius: "5px",
  cursor: "pointer",
};

const card = {
  width: "250px",
  background: "white",
  borderRadius: "12px",
  padding: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const cardImg = {
  width: "100%",
  height: "160px",
  objectFit: "cover",
  borderRadius: "8px",
};

const viewBtn = {
  marginTop: "10px",
  padding: "8px 12px",
  background: "#4da6ff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modal = {
  background: "white",
  padding: "25px",
  borderRadius: "12px",
  width: "400px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalImg = {
  width: "100%",
  height: "220px",
  objectFit: "cover",
  borderRadius: "8px",
  marginBottom: "15px",
};

const adoptBtn = {
  padding: "10px 14px",
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const editBtn = {
  marginLeft: "10px",
  padding: "10px 14px",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const deleteBtn = {
  marginLeft: "10px",
  padding: "10px 14px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const closeBtn = {
  marginLeft: "10px",
  padding: "10px 14px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default Home;