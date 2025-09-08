
import React from 'react';
import { ImageFile } from '../types';

interface RightPanelProps {
  isLoading: boolean;
  generatedImage: ImageFile | null;
  error: string | null;
  editCurrentImage: () => void;
  downloadImage: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  isLoading, generatedImage, error, editCurrentImage, downloadImage
}) => {
  return (
    <main className="right-panel flex-1 bg-panel-bg p-6 rounded-lg flex items-center justify-center relative md:block hidden">
      {isLoading && (
        <div id="loadingContainer" className="loading-container text-center">
          <div className="loading-spinner w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="loading-text mt-4 text-lg">Gerando sua imagem...</p>
        </div>
      )}

      {!isLoading && !generatedImage && !error && (
        <div id="resultPlaceholder" className="result-placeholder text-center text-text-secondary">
          <div className="result-placeholder-icon text-6xl">🎨</div>
          <p className="mt-4 text-xl">Sua obra de arte aparecerá aqui</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center text-red-400">
           <div className="text-6xl">😕</div>
           <p className="mt-4 text-xl">Oops, algo deu errado!</p>
          <p className="text-text-secondary">{error}</p>
        </div>
      )}

      {!isLoading && generatedImage && (
        <div id="imageContainer" className="image-container w-full h-full flex flex-col items-center justify-center gap-4">
          <img
            id="generatedImage"
            src={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`}
            alt="Generated Art"
            className="generated-image max-w-full max-h-[80vh] object-contain rounded-lg"
          />
          <div className="image-actions flex gap-4 mt-2">
            <button
              onClick={editCurrentImage}
              title="Editar"
              className="action-btn bg-input-bg hover:bg-border-color text-text-primary font-bold p-3 rounded-full text-xl transition-colors"
            >
              ✏️
            </button>
            <button
              onClick={downloadImage}
              title="Download"
              className="action-btn bg-input-bg hover:bg-border-color text-text-primary font-bold p-3 rounded-full text-xl transition-colors"
            >
              💾
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default RightPanel;
