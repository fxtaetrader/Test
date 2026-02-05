export const API_BASE = "http://localhost:5000";

export async function uploadVideo(file) {
  const formData = new FormData();
  formData.append("video", file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData
  });

  return res.json();
}

export async function exportVideo(payload) {
  const res = await fetch(`${API_BASE}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
}
