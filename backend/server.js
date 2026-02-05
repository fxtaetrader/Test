import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

const uploadsDir = path.join(process.cwd(), "uploads");
const outputsDir = path.join(process.cwd(), "outputs");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const id = uuidv4();
    cb(null, `${id}-${file.originalname}`);
  }
});

const upload = multer({ storage });

/**
 * Upload video
 */
app.post("/api/upload", upload.single("video"), (req, res) => {
  res.json({
    success: true,
    file: req.file.filename
  });
});

/**
 * Export video
 * Supports:
 * - trim start/end
 * - overlay text
 * - overlay image
 */
app.post("/api/export", async (req, res) => {
  try {
    const {
      inputFile,
      trimStart = 0,
      trimEnd = null,
      text = "",
      textX = 50,
      textY = 50,
      fontSize = 40,
      imageOverlay = null,
      imageX = 100,
      imageY = 100
    } = req.body;

    const inputPath = path.join(uploadsDir, inputFile);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ success: false, message: "Input file not found" });
    }

    const outputFile = `${uuidv4()}.mp4`;
    const outputPath = path.join(outputsDir, outputFile);

    let cmd = ffmpeg(inputPath);

    // Trim
    cmd.setStartTime(Number(trimStart));
    if (trimEnd !== null) {
      const duration = Number(trimEnd) - Number(trimStart);
      if (duration > 0) cmd.setDuration(duration);
    }

    // Filters
    let filters = [];

    // Text overlay
    if (text && text.trim().length > 0) {
      filters.push({
        filter: "drawtext",
        options: {
          text: text.replace(/:/g, "\\:"),
          fontcolor: "white",
          fontsize: fontSize,
          x: textX,
          y: textY,
          box: 1,
          boxcolor: "black@0.5",
          boxborderw: 10
        }
      });
    }

    // Image overlay
    if (imageOverlay) {
      const overlayPath = path.join(uploadsDir, imageOverlay);
      if (fs.existsSync(overlayPath)) {
        cmd = cmd.input(overlayPath);
        filters.push({
          filter: "overlay",
          options: {
            x: imageX,
            y: imageY
          }
        });
      }
    }

    // Apply filters
    if (filters.length > 0) cmd.complexFilter(filters);

    // Export high quality (avoid blur)
    cmd
      .outputOptions([
        "-preset veryslow",
        "-crf 18",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        "-r 30",
        "-b:v 8000k"
      ])
      .on("end", () => {
        res.json({ success: true, outputFile });
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err.message);
        res.status(500).json({ success: false, message: err.message });
      })
      .save(outputPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Download exported file
 */
app.get("/api/download/:file", (req, res) => {
  const filePath = path.join(outputsDir, req.params.file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }
  res.download(filePath);
});

app.listen(PORT, () => {
  console.log(`Nexus Pro backend running on http://localhost:${PORT}`);
});
