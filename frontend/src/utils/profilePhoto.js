const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 500_000;
const MAX_IMAGE_PIXELS = 50_000_000;
const MAX_IMAGE_SIDE = 512;

export function encodeProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      reject(new Error('เลือกรูปภาพ JPG, PNG หรือ WebP'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('รูปภาพต้องมีขนาดไม่เกิน 10 MB'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปภาพไม่สำเร็จ กรุณาลองใหม่'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('ไฟล์นี้ไม่ใช่รูปภาพที่ใช้งานได้'));
      image.onload = () => {
        if (image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
          reject(new Error('ความละเอียดรูปภาพสูงเกินไป กรุณาเลือกรูปอื่น'));
          return;
        }

        const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('เตรียมรูปภาพไม่สำเร็จ กรุณาลองใหม่'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        if (dataUrl.length > MAX_DATA_URL_LENGTH) {
          reject(new Error('รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกรูปอื่น'));
          return;
        }
        resolve(dataUrl);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
