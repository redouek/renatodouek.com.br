import React from 'react';
import { Mode, CreateFunction, EditFunction, ImageFile, AspectRatio } from '../types';
import FunctionCard from './FunctionCard';
import UploadArea from './UploadArea';

interface LeftPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  negativePrompt: string;
  setNegativePrompt: (prompt: string) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  createFunction: CreateFunction;
  setCreateFunction: (fn: CreateFunction) => void;
  editFunction: EditFunction;
  setEditFunction: (fn: EditFunction) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  image1: ImageFile | null;
  image2: ImageFile | null;
  handleImageUpload: (file: File, imageSlot: 1 | 2 | 'single') => void;
  clearImage: (imageSlot: 1 | 2 | 'single') => void;
  generateImage: () => void;
  isLoading: boolean;
  showTwoImagesView: boolean;
  setShowTwoImagesView: (show: boolean) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  prompt, setPrompt, negativePrompt, setNegativePrompt, mode, setMode, createFunction, setCreateFunction,
  editFunction, setEditFunction, aspectRatio, setAspectRatio, image1, image2, handleImageUpload,
  clearImage, generateImage, isLoading, showTwoImagesView, setShowTwoImagesView
}) => {

  const handleEditFunctionClick = (fn: EditFunction) => {
    setEditFunction(fn);
    if (fn === EditFunction.Compose) {
      setShowTwoImagesView(true);
    } else {
      setShowTwoImagesView(false);
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setShowTwoImagesView(false); // Reset view when switching modes
  }

  const createFunctions = [
    { key: CreateFunction.Free, icon: '✨', name: 'Prompt' },
    { key: CreateFunction.Sticker, icon: '🏷️', name: 'Adesivos' },
    { key: CreateFunction.Text, icon: '📝', name: 'Logo' },
    { key: CreateFunction.Comic, icon: '💭', name: 'HQ' },
  ];

  const editFunctions = [
    { key: EditFunction.AddRemove, icon: '➕', name: 'Adicionar' },
    { key: EditFunction.Retouch, icon: '🎯', name: 'Retoque' },
    { key: EditFunction.Style, icon: '🎨', name: 'Estilo' },
    { key: EditFunction.Compose, icon: '🖼️', name: 'Unir' },
  ];
  
  const aspectRatios: { key: AspectRatio; label: string }[] = [
    { key: '1:1', label: '1:1' },
    { key: '16:9', label: '16:9' },
    { key: '9:16', label: '9:16' },
    { key: '4:3', label: '4:3' },
    { key: '3:4', label: '3:4' },
  ];

  return (
    <aside className="left-panel md:w-1/3 lg:w-1/4 bg-panel-bg p-6 rounded-lg flex flex-col gap-6 h-full">
      <header>
        <h1 className="panel-title text-2xl font-bold">🎨 AI Image Studio</h1>
        <p className="panel-subtitle text-text-secondary">Gerador profissional de imagens</p>
      </header>

      <section className="prompt-section">
        <h2 className="section-title font-semibold mb-2">💭 Descreva sua ideia</h2>
        <textarea
          id="prompt"
          className="prompt-input w-full bg-input-bg border border-border-color rounded-md p-3 focus:ring-2 focus:ring-accent focus:outline-none transition duration-200 h-28 resize-none"
          placeholder="Descreva a imagem que você deseja criar..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </section>
      
      {mode === Mode.Create && (
        <section className="negative-prompt-section">
          <h2 className="section-title font-semibold mb-2 text-text-secondary">🚫 Elementos a evitar (Opcional)</h2>
          <textarea
            id="negative-prompt"
            className="prompt-input w-full bg-input-bg border border-border-color rounded-md p-3 focus:ring-2 focus:ring-accent focus:outline-none transition duration-200 h-20 resize-none"
            placeholder="Ex: texto, feio, mãos deformadas..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
          />
        </section>
      )}

      <div className="mode-toggle grid grid-cols-2 gap-2 bg-input-bg p-1 rounded-md">
        <button
          onClick={() => handleModeChange(Mode.Create)}
          className={`mode-btn p-2 rounded transition-colors duration-200 ${mode === Mode.Create ? 'bg-accent text-white' : 'hover:bg-border-color'}`}
        >
          Criar
        </button>
        <button
          onClick={() => handleModeChange(Mode.Edit)}
          className={`mode-btn p-2 rounded transition-colors duration-200 ${mode === Mode.Edit ? 'bg-accent text-white' : 'hover:bg-border-color'}`}
        >
          Editar
        </button>
      </div>

      {mode === Mode.Create && (
        <>
          <section id="createFunctions" className="functions-section">
            <h2 className="section-title font-semibold mb-2">🎨 Estilo de Criação</h2>
            <div className="functions-grid grid grid-cols-2 gap-3">
              {createFunctions.map(fn => (
                <FunctionCard 
                  key={fn.key}
                  icon={fn.icon}
                  name={fn.name}
                  isActive={createFunction === fn.key}
                  onClick={() => setCreateFunction(fn.key)}
                />
              ))}
            </div>
          </section>
          <section className="aspect-ratio-section">
            <h2 className="section-title font-semibold mb-2">🖼️ Proporção</h2>
            <div className="grid grid-cols-5 gap-2 text-sm">
                {aspectRatios.map(ratio => (
                    <button
                        key={ratio.key}
                        onClick={() => setAspectRatio(ratio.key)}
                        className={`p-2 rounded-md border-2 transition-colors duration-200 ${
                            aspectRatio === ratio.key
                            ? 'bg-accent/20 border-accent font-bold'
                            : 'bg-input-bg border-transparent hover:border-border-color'
                        }`}
                        title={`Proporção ${ratio.label}`}
                    >
                        {ratio.label}
                    </button>
                ))}
            </div>
          </section>
        </>
      )}

      {mode === Mode.Edit && !showTwoImagesView && (
        <>
        <section id="editFunctions" className="functions-section">
          <h2 className="section-title font-semibold mb-2">🎨 Função de Edição</h2>
          <div className="functions-grid grid grid-cols-2 gap-3">
            {editFunctions.map(fn => (
              <FunctionCard 
                key={fn.key}
                icon={fn.icon}
                name={fn.name}
                isActive={editFunction === fn.key}
                onClick={() => handleEditFunctionClick(fn.key)}
              />
            ))}
          </div>
        </section>
        <div className="dynamic-content">
            <UploadArea
                id="imageUpload"
                image={image1}
                onUpload={(file) => handleImageUpload(file, 'single')}
                onClear={() => clearImage('single')}
            />
        </div>
        </>
      )}
      
      {mode === Mode.Edit && showTwoImagesView && (
        <section id="twoImagesSection" className="functions-section flex flex-col gap-4">
            <h2 className="section-title font-semibold text-center">📸 Duas Imagens Necessárias</h2>
            <UploadArea
                id="imageUpload1"
                image={image1}
                onUpload={(file) => handleImageUpload(file, 1)}
                onClear={() => clearImage(1)}
                title="Primeira Imagem"
                isDual
            />
             <UploadArea
                id="imageUpload2"
                image={image2}
                onUpload={(file) => handleImageUpload(file, 2)}
                onClear={() => clearImage(2)}
                title="Segunda Imagem"
                isDual
            />
            <button
                className="back-btn text-accent hover:underline"
                onClick={() => setShowTwoImagesView(false)}
            >
                ← Voltar para Edição
            </button>
        </section>
      )}

      <div className="mt-auto">
        <button
          id="generateBtn"
          className="generate-btn w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          onClick={generateImage}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="btn-text">Gerando...</span>
            </>
          ) : (
            <span className="btn-text">🚀 Gerar Imagem</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default LeftPanel;