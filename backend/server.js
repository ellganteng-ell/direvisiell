
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const multer = require("multer");
const mammoth = require("mammoth");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ||
    "https://ellganteng-ell.github.io"
}));

app.use(express.json({ limit: "100kb" }));

// Limit requests
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
}));

// Temporary file storage in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const isDocx =
      file.originalname.toLowerCase().endsWith(".docx") &&
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isDocx) {
      return callback(
        new Error("File harus berformat Word .docx")
      );
    }

    callback(null, true);
  }
});

// Test endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    project: "Di Revisi Ell",
    message: "Backend berhasil dijalankan."
  });
});

// Document upload endpoint
app.post(
  "/api/check",
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Dokumen belum diunggah."
        });
      }

      const result = await mammoth.extractRawText({
        buffer: req.file.buffer
      });

      const documentText = result.value.trim();

      if (!documentText) {
        return res.status(400).json({
          error: "Tidak ditemukan teks dalam dokumen."
        });
      }

      res.json({
        status: "success",
        message: "Dokumen berhasil dibaca.",
        characterCount: documentText.length,
        aiCheck: "Belum diaktifkan."
      });

    } catch (error) {
      console.error("Document processing failed:", error);

      res.status(500).json({
        error: "Dokumen gagal diproses."
      });
    }
  }
);

// Error handler
app.use((err, req, res, next) => {
  res.status(400).json({
    error: err.message || "Terjadi kesalahan."
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Di Revisi Ell running on port ${PORT}`);
});
