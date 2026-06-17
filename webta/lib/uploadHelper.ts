export const uploadToStorage = async (file: File, bucket: string, prefix: string = '') => {
  const ext = file.name.split('.').pop();
  const fileName = `${prefix ? prefix + '-' : ''}${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('fileName', fileName);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal mengunggah file');

  return { publicUrl: data.publicUrl, fileName };
};

export const removeFromStorage = async (bucket: string, fileNames: string[]) => {
  if (fileNames.length === 0) return { success: true };
  
  const res = await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, fileNames })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menghapus file');

  return data;
};
