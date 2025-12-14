
import { ImageFile } from '../types';

export const fileToImageFile = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error("File size exceeds 10MB limit."));
        return;
    }
      
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      if (base64String) {
        resolve({
            base64: base64String,
            mimeType: file.type
        });
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
