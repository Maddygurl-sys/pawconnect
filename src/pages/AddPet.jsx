import { useState } from "react";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { uploadToDropbox } from "../dropboxUpload";
import { addPetToMongo } from "../services/petService";
import { useAuth } from "../context/AuthContext";

function AddPet() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [dropboxPath, setDropboxPath] = useState("");
  const [uploading, setUploading] = useState(false);

  // Upload image to Dropbox server
  async function handleImageUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    // Immediately display preview from local file
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setUploading(true);

    try {
      const data = await uploadToDropbox(file);
      setImageUrl(data.imageUrl);
      setDropboxPath(data.dropboxPath);
      alert("Image uploaded to Dropbox successfully!");
    } catch (error) {
      console.error(error);
      alert(error.message || "Error uploading image");
    }

    setUploading(false);
  }

  // Save pet data to Firestore and MongoDB
  async function handleSubmit(e) {
    e.preventDefault();

    if (!imageUrl) {
      alert("Please upload an image first");
      return;
    }

    let firebaseId = null;
    try {
      const ownerId = user?.sub || "";
      const ownerEmail = user?.email || "";

      const petPayload = {
        petName,
        breed,
        age,
        gender,
        location,
        contact,
        description,
        imageUrl,
        dropboxPath,
        ownerId,
        ownerEmail,
        isAdopted: false,
        adoptedBy: "",
        adoptedAt: null,
      };

      // 1. Save to Firestore
      const docRef = await addDoc(collection(db, "pets"), petPayload);

      firebaseId = docRef.id;

      // 2. Save to MongoDB via backend API
      await addPetToMongo({
        firebaseId,
        ...petPayload,
      });

      alert("Pet Added Successfully to Firestore & MongoDB!");
      navigate("/");
    } catch (error) {
      console.error("Error creating pet:", error);
      
      // Rollback Firestore if MongoDB fails
      if (firebaseId) {
        try {
          await deleteDoc(doc(db, "pets", firebaseId));
          console.log("Rolled back Firestore document:", firebaseId);
        } catch (rollbackError) {
          console.error("Firestore rollback failed:", rollbackError);
        }
      }

      alert(`Failed to add pet: ${error.message}`);
    }
  }

  return (
    <div style={container}>
      <div style={formBox}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Add New Pet
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Pet Name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Breed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            style={inputStyle}
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Contact Number"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            style={inputStyle}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <label style={{ fontWeight: "bold" }}>Upload Pet Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            required
            style={{ marginTop: "10px", marginBottom: "15px" }}
          />

          {uploading && <p>Uploading image...</p>}

          {(previewUrl || imageUrl) && (
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <img
                src={previewUrl || imageUrl}
                alt="Preview"
                style={{
                  width: "220px",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "2px solid #ddd",
                }}
              />
            </div>
          )}

          <button type="submit" style={buttonStyle}>
            Add Pet
          </button>
        </form>
      </div>
    </div>
  );
}

const container = {
  minHeight: "100vh",
  background: "#eef3f7",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
};

const formBox = {
  width: "100%",
  maxWidth: "500px",
  background: "white",
  padding: "30px",
  borderRadius: "15px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#0f3b46",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

export default AddPet;