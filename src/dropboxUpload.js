export async function uploadToDropbox(file) {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch("http://localhost:5001/api/pets/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Dropbox upload failed");
  }

  return data;
}