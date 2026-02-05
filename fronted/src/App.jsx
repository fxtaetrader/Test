import React, { useMemo, useState } from "react";
import { API_BASE, exportVideo, uploadVideo } from "./api";

export default function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [serverFile, setServerFile] = useState(null);

  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(null);

  const [text, setText] = useState("NEXUS PRO");
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);
  const [fontSize, setFontSize] = useState(42);

  const [overlayImage, setOverlayImage] = useState(null);
  const [overlayServerFile, setOverlayServerFile] = useState(null);
  const [imageX, setImageX] = useState(120);
  const [imageY, setImageY] = useState(120);

  const [status, setStatus] = useState("");
  const [downloadFile, setDownloadFile] = useState(null);

  const previewURL = useMemo(() => {
    if (!videoFile) return null;
    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  async function handleUpload() {
    if (!videoFile) return;

    setStatus("Uploading video...");
    const data = await uploadVideo(videoFile);

    if (!data.success) {
      setStatus("Upload failed.");
      return;
    }

    setServerFile(data.file);
    setStatus("Video uploaded successfully ✅");
  }

  async function handleUploadOverlay() {
    if (!overlayImage) return;

    setStatus("Uploading overlay image...");
    const data = await uploadVideo(overlayImage);

    if (!data.success) {
      setStatus("Overlay upload failed.");
      return;
    }

    setOverlayServerFile(data.file);
    setStatus("Overlay uploaded ✅");
  }

  async function handleExport() {
    if (!serverFile) {
      setStatus("Upload the video first.");
      return;
    }

    setStatus("Exporting high quality video... (FFmpeg)");
    setDownloadFile(null);

    const payload = {
      inputFile: serverFile,
      trimStart: Number(trimStart),
      trimEnd: trimEnd === "" ? null : trimEnd === null ? null : Number(trimEnd),
      text,
      textX: Number(textX),
      textY: Number(textY),
      fontSize: Number(fontSize),
      imageOverlay: overlayServerFile,
      imageX: Number(imageX),
      imageY: Number(imageY)
    };

    const data = await exportVideo(payload);

    if (!data.success) {
      setStatus("Export failed: " + (data.message || "unknown error"));
      return;
    }

    setDownloadFile(data.outputFile);
    setStatus("Export done ✅ Download ready!");
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="logo">N</div>
          <div>
            <h1>Nexus Video Editing</h1>
            <p>Pro Editor (Server FFmpeg)</p>
          </div>
        </div>
      </header>

      <div className="grid">
        <section className="card">
          <h2>1) Upload Video</h2>

          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />

          <button onClick={handleUpload} disabled={!videoFile}>
            Upload to Server
          </button>

          {previewURL && (
            <video className="preview" controls src={previewURL}></video>
          )}
        </section>

        <section className="card">
          <h2>2) Trim</h2>

          <label>
            Trim Start (seconds)
            <input
              type="number"
              value={trimStart}
              onChange={(e) => setTrimStart(e.target.value)}
              min="0"
              step="0.1"
            />
          </label>

          <label>
            Trim End (seconds) (optional)
            <input
              type="number"
              value={trimEnd ?? ""}
              onChange={(e) => setTrimEnd(e.target.value)}
              min="0"
              step="0.1"
            />
          </label>
        </section>

        <section className="card">
          <h2>3) Text Overlay</h2>

          <label>
            Text
            <input value={text} onChange={(e) => setText(e.target.value)} />
          </label>

          <div className="row">
            <label>
              X
              <input
                type="number"
                value={textX}
                onChange={(e) => setTextX(e.target.value)}
              />
            </label>

            <label>
              Y
              <input
                type="number"
                value={textY}
                onChange={(e) => setTextY(e.target.value)}
              />
            </label>

            <label>
              Size
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>4) Image Overlay (Sticker)</h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setOverlayImage(e.target.files?.[0] || null)}
          />

          <button onClick={handleUploadOverlay} disabled={!overlayImage}>
            Upload Overlay
          </button>

          <div className="row">
            <label>
              X
              <input
                type="number"
                value={imageX}
                onChange={(e) => setImageX(e.target.value)}
              />
            </label>

            <label>
              Y
              <input
                type="number"
                value={imageY}
                onChange={(e) => setImageY(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>5) Export High Quality</h2>

          <button className="export" onClick={handleExport}>
            Export 1080p HQ
          </button>

          {downloadFile && (
            <a
              className="download"
              href={`${API_BASE}/api/download/${downloadFile}`}
              target="_blank"
              rel="noreferrer"
            >
              Download Exported Video
            </a>
          )}

          <p className="status">{status}</p>
        </section>
      </div>

      <footer className="footer">
        Nexus Pro — Next upgrade: Voice templates + Auto enhancement + Timeline
      </footer>
    </div>
  );
}
