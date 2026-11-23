import axiosClient from './axiosClient';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const uploadKitchenEvidence = async (file: File, folder: string = 'kidpro/kitchen/evidence'): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ chấp nhận tệp hình ảnh.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ảnh không được vượt quá 10 MB.');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res: any = await axiosClient.post('/kitchen/inspection-logs/upload-evidence', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const url = res?.data?.url || res?.url;
    if (url) return url;
    return await fileToBase64(file);
  } catch (err: any) {
    console.warn('Lỗi khi tải ảnh lên backend/Cloudinary, sử dụng Base64 dự phòng:', err?.message || err);
    return await fileToBase64(file);
  }
};

export const openKitchenEvidence = async (path: string): Promise<void> => {
  if (path.startsWith('data:image/') || path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<title>Ảnh bằng chứng kiểm thực</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${path}" style="max-width:95%;max-height:95%;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.5);"/></body>`);
    }
    return;
  }

  window.open(path, '_blank');
};
