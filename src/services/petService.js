const API_URL = "http://localhost:5001/api/pets";

/* =========================
   GET ALL PETS
========================= */

export async function getPetsFromMongo() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to find pets");
  }

  return await response.json();
}

/* =========================
   FIND ONE PET
========================= */

export async function findPetInMongo(firebaseId) {
  const response = await fetch(
    `${API_URL}/${firebaseId}`
  );

  if (!response.ok) {
    throw new Error("Pet not found");
  }

  return await response.json();
}

/* =========================
   ADD PET
========================= */

export async function addPetToMongo(pet) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(pet),
  });

  if (!response.ok) {
    throw new Error("Failed to add pet to MongoDB");
  }

  return await response.json();
}

/* =========================
   UPDATE PET
========================= */

export async function updatePetInMongo(
  firebaseId,
  pet
) {
  const response = await fetch(
    `${API_URL}/${firebaseId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(pet),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to update pet in MongoDB"
    );
  }

  return await response.json();
}

/* =========================
   DELETE PET
========================= */

export async function deletePetFromMongo(
  firebaseId
) {
  const response = await fetch(
    `${API_URL}/${firebaseId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to delete pet from MongoDB"
    );
  }

  return await response.json();
}

/* =========================
   SEARCH PET
========================= */

export async function searchPets(name) {
  const response = await fetch(
    `${API_URL}/search/${encodeURIComponent(name)}`
  );

  if (!response.ok) {
    throw new Error("Search failed");
  }

  return await response.json();
}

/* =========================
   DROPBOX IMAGE UPLOAD
========================= */

export async function uploadToDropbox(file) {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(
    "http://localhost:5001/api/pets/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Dropbox upload failed");
  }

  return await response.json();
}

/* =========================
   ADOPT PET IN MONGO
========================= */

export async function adoptPetInMongo(firebaseId, adoptedBy, adoptedAt) {
  try {
    const response = await fetch(`${API_URL}/${firebaseId}/adopt`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adoptedBy, adoptedAt }),
    });

    if (!response.ok) {
      console.warn("Could not sync pet adoption to MongoDB");
    }

    return await response.json();
  } catch (error) {
    console.warn("MongoDB adopt sync error:", error.message);
  }
}