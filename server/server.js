const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const { Dropbox } = require("dropbox");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

/* =====================================================
   MULTER
   Receives images from React
===================================================== */

const upload = multer({
  storage: multer.memoryStorage(),
});

/* =====================================================
   MONGODB ATLAS CONNECTION
===================================================== */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Atlas connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

/* =====================================================
   MONGODB PET SCHEMA
===================================================== */

const petSchema = new mongoose.Schema(
  {
    firebaseId: {
      type: String,
      required: true,
      unique: true,
    },

    petName: {
      type: String,
      required: true,
    },

    breed: {
      type: String,
      default: "",
    },

    age: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    gender: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    contact: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    imageUrl: {
      type: String,
      default: "",
    },

    dropboxPath: {
      type: String,
      default: "",
    },

    ownerId: {
      type: String,
      default: "",
    },

    ownerEmail: {
      type: String,
      default: "",
    },

    userId: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    isAdopted: {
      type: Boolean,
      default: false,
    },

    adoptedBy: {
      type: String,
      default: "",
    },

    adoptedAt: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Pet = mongoose.model("Pet", petSchema);

/* =====================================================
   DROPBOX
===================================================== */

const dbx = new Dropbox({
  clientId: process.env.DROPBOX_APP_KEY,
  clientSecret: process.env.DROPBOX_APP_SECRET,
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
});

/* =====================================================
   TEST SERVER
===================================================== */

app.get("/", (req, res) => {
  res.json({
    message: "PawConnect API is running",
  });
});

/* =====================================================
   DROPBOX IMAGE UPLOAD
   POST /api/pets/upload
===================================================== */

app.post(
  "/api/pets/upload",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image uploaded",
        });
      }

      const fileName =
        Date.now() + "_" + req.file.originalname;

      const dropboxPath =
        `/pawconnect/${fileName}`;

      const response = await dbx.filesUpload({
        path: dropboxPath,
        contents: req.file.buffer,
      });

      console.log(
        "Image uploaded to Dropbox:",
        response.result.path_display
      );

      let imageUrl = "";
      try {
        const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: dropboxPath,
        });
        imageUrl = sharedLinkResponse.result.url
          .replace("www.dropbox.com", "dl.dropboxusercontent.com")
          .replace(/[?&]dl=0/, "");
      } catch (linkError) {
        const errorSummary = linkError?.error?.error_summary || linkError?.message || "";
        if (errorSummary.includes("shared_link_already_exists") || linkError.status === 409) {
          const existingLinks = await dbx.sharingListSharedLinks({
            path: dropboxPath,
            direct_only: true
          });
          if (existingLinks.result.links && existingLinks.result.links.length > 0) {
            imageUrl = existingLinks.result.links[0].url
              .replace("www.dropbox.com", "dl.dropboxusercontent.com")
              .replace(/[?&]dl=0/, "");
          } else {
            throw linkError;
          }
        } else {
          throw linkError;
        }
      }

      res.json({
        imageUrl: imageUrl,
        dropboxPath: response.result.path_display,
        name: response.result.name,
      });

    } catch (error) {
      console.error(
        "Dropbox upload error:",
        error
      );

      res.status(500).json({
        message: "Dropbox upload failed",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   FIND ALL PETS
   GET /api/pets
===================================================== */

app.get("/api/pets", async (req, res) => {
  try {
    const pets = await Pet.find()
      .sort({ createdAt: -1 });

    res.json(pets);

  } catch (error) {
    console.error(
      "Find all pets error:",
      error
    );

    res.status(500).json({
      message: "Failed to find pets",
      error: error.message,
    });
  }
});

/* =====================================================
   FIND ONE PET
   GET /api/pets/:firebaseId
===================================================== */

app.get(
  "/api/pets/:firebaseId",
  async (req, res) => {
    try {
      const pet = await Pet.findOne({
        firebaseId:
          req.params.firebaseId,
      });

      if (!pet) {
        return res.status(404).json({
          message: "Pet not found",
        });
      }

      res.json(pet);

    } catch (error) {
      console.error(
        "Find pet error:",
        error
      );

      res.status(500).json({
        message: "Failed to find pet",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   SEARCH PETS BY NAME
   GET /api/pets/search/:name
===================================================== */

app.get(
  "/api/pets/search/:name",
  async (req, res) => {
    try {
      const pets = await Pet.find({
        petName: {
          $regex: req.params.name,
          $options: "i",
        },
      });

      res.json(pets);

    } catch (error) {
      console.error(
        "Search error:",
        error
      );

      res.status(500).json({
        message: "Failed to search pets",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   ADD PET
   POST /api/pets

   React sends:
   {
      firebaseId,
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
      ownerEmail
   }
===================================================== */

app.post("/api/pets", async (req, res) => {
  try {
    const pet = await Pet.create(req.body);

    console.log(
      "Pet added to MongoDB:",
      pet.petName
    );

    res.status(201).json(pet);

  } catch (error) {
    console.error(
      "Add pet error:",
      error
    );

    res.status(500).json({
      message: "Failed to add pet",
      error: error.message,
    });
  }
});

/* =====================================================
   UPDATE PET
   PUT /api/pets/:firebaseId
===================================================== */

app.put(
  "/api/pets/:firebaseId",
  async (req, res) => {
    try {
      const updatedPet =
        await Pet.findOneAndUpdate(
          {
            firebaseId:
              req.params.firebaseId,
          },

          req.body,

          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedPet) {
        return res.status(404).json({
          message: "Pet not found",
        });
      }

      console.log(
        "Pet updated in MongoDB:",
        updatedPet.petName
      );

      res.json(updatedPet);

    } catch (error) {
      console.error(
        "Update pet error:",
        error
      );

      res.status(500).json({
        message: "Failed to update pet",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   DELETE PET
   DELETE /api/pets/:firebaseId

   Deletes:
   1. MongoDB document
   2. Dropbox image
===================================================== */

app.delete(
  "/api/pets/:firebaseId",
  async (req, res) => {
    try {
      const pet = await Pet.findOne({
        firebaseId:
          req.params.firebaseId,
      });

      if (!pet) {
        return res.status(404).json({
          message: "Pet not found",
        });
      }

      /* ---------------------------------------------
         DELETE IMAGE FROM DROPBOX
      --------------------------------------------- */

      if (pet.dropboxPath) {
        try {
          await dbx.filesDeleteV2({
            path: pet.dropboxPath,
          });

          console.log(
            "Dropbox image deleted:",
            pet.dropboxPath
          );

        } catch (dropboxError) {
          console.log(
            "Dropbox delete warning:",
            dropboxError.message
          );
        }
      }

      /* ---------------------------------------------
         DELETE FROM MONGODB
      --------------------------------------------- */

      await Pet.deleteOne({
        firebaseId:
          req.params.firebaseId,
      });

      console.log(
        "Pet deleted from MongoDB:",
        pet.petName
      );

      res.json({
        message:
          "Pet deleted successfully",
      });

    } catch (error) {
      console.error(
        "Delete pet error:",
        error
      );

      res.status(500).json({
        message: "Failed to delete pet",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   ADOPT PET
   PUT /api/pets/:firebaseId/adopt
===================================================== */

app.put("/api/pets/:firebaseId/adopt", async (req, res) => {
  try {
    const { adoptedBy, adoptedAt } = req.body;
    const pet = await Pet.findOneAndUpdate(
      { firebaseId: req.params.firebaseId },
      {
        $set: {
          isAdopted: true,
          adoptedBy: adoptedBy || "Anonymous",
          adoptedAt: adoptedAt || new Date().toISOString(),
        },
      },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({ message: "Pet not found in MongoDB" });
    }

    console.log("Pet marked as adopted in MongoDB:", pet.petName);
    res.json(pet);
  } catch (error) {
    console.error("Adopt pet error:", error);
    res.status(500).json({
      message: "Failed to update pet adoption in MongoDB",
      error: error.message,
    });
  }
});

/* =====================================================
   SYNC PETS FROM FIREBASE TO MONGODB
   POST /api/pets/sync
===================================================== */

app.post("/api/pets/sync", async (req, res) => {
  try {
    const response = await fetch(
      "https://firestore.googleapis.com/v1/projects/pawconnect-87660/databases/(default)/documents/pets"
    );
    const data = await response.json();
    const firestoreDocs = data.documents || [];

    const synced = [];
    for (const doc of firestoreDocs) {
      const firebaseId = doc.name.split("/").pop();
      const f = doc.fields || {};

      const parseVal = (field) => {
        if (!field) return "";
        if ("stringValue" in field) return field.stringValue;
        if ("booleanValue" in field) return field.booleanValue;
        if ("integerValue" in field) return field.integerValue;
        if ("timestampValue" in field) return field.timestampValue;
        if ("nullValue" in field) return null;
        return Object.values(field)[0];
      };

      const petData = {
        firebaseId,
        petName: parseVal(f.petName) || "",
        breed: parseVal(f.breed) || "",
        age: parseVal(f.age) || "",
        gender: parseVal(f.gender) || "",
        location: parseVal(f.location) || "",
        contact: parseVal(f.contact) || "",
        description: parseVal(f.description) || "",
        imageUrl: parseVal(f.imageUrl) || "",
        dropboxPath: parseVal(f.dropboxPath) || "",
        ownerId: parseVal(f.ownerId) || parseVal(f.userId) || "",
        ownerEmail: parseVal(f.ownerEmail) || parseVal(f.email) || "",
        userId: parseVal(f.userId) || parseVal(f.ownerId) || "",
        email: parseVal(f.email) || parseVal(f.ownerEmail) || "",
        isAdopted: Boolean(parseVal(f.isAdopted)),
        adoptedBy: parseVal(f.adoptedBy) || "",
        adoptedAt: parseVal(f.adoptedAt) || null,
      };

      const updated = await Pet.findOneAndUpdate(
        { firebaseId },
        { $set: petData },
        { upsert: true, new: true }
      );
      synced.push(updated);
    }

    res.json({
      message: "Synced successfully from Firebase to MongoDB",
      count: synced.length,
      pets: synced,
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ message: "Sync failed", error: error.message });
  }
});

/* =====================================================
   SERVER
===================================================== */

const PORT =
  process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `PawConnect server running on port ${PORT}`
  );
});