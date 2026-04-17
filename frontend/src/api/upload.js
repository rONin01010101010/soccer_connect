const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8046/api';

export const uploadImage = async (file, folder = 'soccer-connect') => {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/upload?folder=${folder}`, {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Image upload failed');
  }

  const data = await response.json();
  return data.data.url;
};
