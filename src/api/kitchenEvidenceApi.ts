import { supabase } from '../config/supabase';

const BUCKET = 'kitchen-evidence';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const uploadKitchenEvidence = async (file: File, path: string): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ chấp nhận tệp hình ảnh.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ảnh không được vượt quá 10 MB.');
  }

  try {
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type
    });
    if (error) {
      console.warn(`Supabase storage (${BUCKET}) chưa sẵn sàng: ${error.message}. Chuyển sang lưu trữ Base64 cục bộ để chạy thử nghiệm.`);
      return await fileToBase64(file);
    }
    return data.path;
  } catch (err: any) {
    console.warn(`Lỗi kết nối Supabase storage: ${err?.message || err}. Sử dụng Base64 dự phòng.`);
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

  const newWindow = window.open('about:blank', '_blank');
  if (!newWindow) {
    throw new Error('Trình duyệt đã chặn cửa sổ xem ảnh. Hãy cho phép cửa sổ bật lên rồi thử lại.');
  }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error) {
    newWindow.close();
    throw new Error(`Không thể mở ảnh bằng chứng: ${error.message}`);
  }
  newWindow.location.href = data.signedUrl;
};
