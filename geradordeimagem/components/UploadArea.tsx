
import React, { useRef } from 'react';
import { ImageFile } from '../types';

interface UploadAreaProps {
  id: string;
  image: ImageFile | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  title?: string;
  isDual?: boolean;
}

const UploadArea: React.FC<UploadAreaProps> = ({ id, image, onUpload, onClear, title, isDual = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const baseClasses = "border-2 border-dashed border-border-color rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent transition-colors duration-200 relative";
  const sizeClasses = isDual ? "p-4 h-32" : "p-6 h-40";

  return (
    <div 
        className={`${baseClasses} ${sizeClasses}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      <input
        type="file"
        id={id}
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
        ref={inputRef}
      />
      {image ? (
        <>
            <img
                src={`data:${image.mimeType};base64,${image.base64}`}
                alt="Preview"
                className="image-preview w-full h-full object-contain rounded-md"
            />
            <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm"
                title="Remover Imagem"
            >
                X
            </button>
        </>
      ) : (
        <>
          <div className="text-3xl">📁</div>
          <p className="font-semibold mt-2">{title || "Clique ou arraste uma imagem"}</p>
          <p className="upload-text text-xs text-text-secondary">{isDual ? "Clique para selecionar" : "PNG, JPG, WebP (máx. 10MB)"}</p>
        </>
      )}
    </div>
  );
};

export default UploadArea;
