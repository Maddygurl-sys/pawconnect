import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { uploadToDropbox } from "../dropboxUpload";
import { updatePetInMongo } from "../services/petService";
import { useAuth } from "../context/AuthContext";

function EditPet() {
  const { firebaseId } = useParams();
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
  const [isAdopted, setIsAdopted] = useState(false);
  const [adoptedBy, setAdoptedBy] = useState("");
  const [adoptedAt, setAdoptedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch pet details on component mount
  useEffect(() => {
    async function fetchPetDetails() {
      try {
        const docRef = doc(db, "pets", firebaseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPetName(data.petName || "");
          setBreed(data.breed || "");
          setAge(data.age || "");
          setGender(data.gender || "");
          setLocation(data.location || "");
          setContact(data.contact || "");
          setDescription(data.description || "");
          setImageUrl(data.imageUrl || "");
          setDropboxPath(data.dropboxPath || "");
          setIsAdopted(!!data.isAdopted);
          setAdoptedBy(data.adoptedBy || "");
          setAdoptedAt(data.adoptedAt || null);
        } else {
          alert("Pet not found in Firestore!");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching pet details:", error);
        alert("Failed to load pet details");
      } finally {
        setLoading(false);
      }
    }

    fetchPetDetails();
  }, [firebaseId, navigate]);

  // Upload a new image to Dropbox
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
      alert("New image uploaded to Dropbox successfully!");
    } catch (error) {
      console.error(error);
      alert(error.message || "Error uploading image");
    }

    setUploading(false);
  }

  // Update pet details in both Firestore and MongoDB
  async function handleSubmit(e) {
    e.preventDefault();

    if (!imageUrl) {
      alert("Please upload an image first");
      return;
    }

    try {
      const ownerId = user?.sub || "";
      const ownerEmail = user?.email || "";

      const updateData = {
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
        isAdopted,
        adoptedBy,
        adoptedAt,
      };

      // 1. Update in Firestore
      const docRef = doc(db, "pets", firebaseId);
      await updateDoc(docRef, updateData);

      // 2. Update in MongoDB via backend API
      await updatePetInMongo(firebaseId, updateData);

      alert("Pet Updated Successfully in both databases!");
      navigate("/");
    } catch (error) {
      console.error("Error updating pet:", error);
      alert(`Failed to update pet: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Loading pet details...</h2>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={formBox}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Edit Pet Details
        </h2>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Pet Name</label>
          <input
            type="text"
            placeholder="Pet Name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Breed</label>
          <input
            type="text"
            placeholder="Breed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Age</label>
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Gender</label>
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

          <label style={labelStyle}>Location</label>
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Contact Number</label>
          <input
            type="text"
            placeholder="Contact Number"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Description</label>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
            Change Pet Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ marginTop: "5px", marginBottom: "15px" }}
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

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" style={buttonStyle}>
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{ ...buttonStyle, background: "#6b7280" }}
            >
              Cancel
            </button>
          </div>
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

const labelStyle = {
  fontWeight: "bold",
  fontSize: "14px",
  color: "#374151",
  marginBottom: "5px",
  display: "block",
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
  flex: 1,
  padding: "12px",
  background: "#0f3b46",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

export default EditPet;
