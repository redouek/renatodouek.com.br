import React, { useState, useCallback, useEffect } from 'react';
import { Mode, CreateFunction, EditFunction, ImageFile, AspectRatio } from './types';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import MobileModal from './components/MobileModal';
import { generateImage, editImage, combineImages } from './services/geminiService';
import { fileToImageFile } from './utils/fileUtils';

const LOCAL_STORAGE_KEYS = {
  PROMPT: 'aiImageStudio_prompt',
  NEGATIVE_PROMPT: 'aiImageStudio_negativePrompt',
  MODE: 'aiImageStudio_mode',
  CREATE_FUNCTION: 'aiImageStudio_createFunction',
  EDIT_FUNCTION: 'aiImageStudio_editFunction',
  ASPECT_RATIO: 'aiImageStudio_aspectRatio',
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.PROMPT) || '';
  });
  const [negativePrompt, setNegativePrompt] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.NEGATIVE_PROMPT) || '';
  });
  const [mode, setMode] = useState<Mode>(() => {
    const savedMode = localStorage.getItem(LOCAL_STORAGE_KEYS.MODE) as Mode;
    return savedMode && Object.values(Mode).includes(savedMode) ? savedMode : Mode.Create;
  });
  const [createFunction, setCreateFunction] = useState<CreateFunction>(() => {
    const savedFunc = localStorage.getItem(LOCAL_STORAGE_KEYS.CREATE_FUNCTION) as CreateFunction;
    return savedFunc && Object.values(CreateFunction).includes(savedFunc) ? savedFunc : CreateFunction.Free;
  });
  const [editFunction, setEditFunction] = useState<EditFunction>(() => {
    const savedFunc = localStorage.getItem(LOCAL_STORAGE_KEYS.EDIT_FUNCTION) as EditFunction;
    return savedFunc && Object.values(EditFunction).includes(savedFunc) ? savedFunc : EditFunction.AddRemove;
  });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => {
    const savedRatio = localStorage.getItem(LOCAL_STORAGE_KEYS.ASPECT_RATIO) as AspectRatio;
    const validRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    return savedRatio && validRatios.includes(savedRatio) ? savedRatio : '1:1';
  });
  
  const [image1, setImage1] = useState<ImageFile | null>(null);
  const [image2, setImage2] = useState<ImageFile | null>(null);
  
  const [generatedImage, setGeneratedImage] = useState<ImageFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showTwoImagesView, setShowTwoImagesView] = useState<boolean>(false);

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROMPT, prompt);
    localStorage.setItem(LOCAL_STORAGE_KEYS.NEGATIVE_PROMPT, negativePrompt);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MODE, mode);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CREATE_FUNCTION, createFunction);
    localStorage.setItem(LOCAL_STORAGE_KEYS.EDIT_FUNCTION, editFunction);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ASPECT_RATIO, aspectRatio);
  }, [prompt, negativePrompt, mode, createFunction, editFunction, aspectRatio]);


  const handleGenerate = useCallback(async () => {
    if (!prompt && mode === Mode.Create) {
      setError('Por favor, descreva sua ideia.');
      return;
    }
     if (mode === Mode.Edit && !prompt && !image1) {
      setError('Por favor, descreva sua ideia ou envie uma imagem.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let result: ImageFile | null = null;
      if (mode === Mode.Create) {
        result = await generateImage(prompt, createFunction, aspectRatio, negativePrompt);
      } else { // Mode.Edit
        if (!image1) {
          setError('Por favor, envie uma imagem para editar.');
          setIsLoading(false);
          return;
        }
        if (editFunction === EditFunction.Compose) {
          if (!image2) {
            setError('A função "Unir" requer duas imagens.');
            setIsLoading(false);
            return;
          }
          result = await combineImages(prompt, image1, image2);
        } else {
          result = await editImage(prompt, editFunction, image1);
        }
      }
      setGeneratedImage(result);
      if (result && window.innerWidth < 768) { // md breakpoint in tailwind
        setIsModalOpen(true);
      }
    } catch (err: any) {
      setError(`Ocorreu um erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, negativePrompt, mode, createFunction, editFunction, image1, image2, aspectRatio]);

  const handleImageUpload = async (file: File, imageSlot: 1 | 2 | 'single') => {
    try {
      const imageFile = await fileToImageFile(file);
      if (imageSlot === 1) setImage1(imageFile);
      else if (imageSlot === 2) setImage2(imageFile);
      else setImage1(imageFile);
    } catch (err: any) {
      setError(`Erro ao carregar imagem: ${err.message}`);
    }
  };

  const clearImage = (imageSlot: 1 | 2 | 'single') => {
    if (imageSlot === 1) setImage1(null);
    else if (imageSlot === 2) setImage2(null);
    else setImage1(null);
  };
  
  const editCurrentImage = () => {
    if (!generatedImage) return;
    setMode(Mode.Edit);
    setImage1(generatedImage);
    setGeneratedImage(null);
    setPrompt('');
    setEditFunction(EditFunction.AddRemove);
    setShowTwoImagesView(false);
    if (window.innerWidth < 768) {
        setIsModalOpen(false);
    }
  }

  const downloadImage = (imageToDownload: ImageFile | null) => {
    if (!imageToDownload) return;
    const link = document.createElement('a');
    link.href = `data:${imageToDownload.mimeType};base64,${imageToDownload.base64}`;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const newImageFromModal = () => {
    setIsModalOpen(false);
    setGeneratedImage(null);
    setPrompt('');
    setImage1(null);
    setImage2(null);
    setMode(Mode.Create);
    setAspectRatio('1:1');
  }

  return (
    <div className="container mx-auto min-h-screen p-4 flex flex-col md:flex-row gap-4">
      <LeftPanel
        prompt={prompt}
        setPrompt={setPrompt}
        negativePrompt={negativePrompt}
        setNegativePrompt={setNegativePrompt}
        mode={mode}
        setMode={setMode}
        createFunction={createFunction}
        setCreateFunction={setCreateFunction}
        editFunction={editFunction}
        setEditFunction={setEditFunction}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        image1={image1}
        image2={image2}
        handleImageUpload={handleImageUpload}
        clearImage={clearImage}
        generateImage={handleGenerate}
        isLoading={isLoading}
        showTwoImagesView={showTwoImagesView}
        setShowTwoImagesView={setShowTwoImagesView}
      />
      <RightPanel
        isLoading={isLoading}
        generatedImage={generatedImage}
        error={error}
        editCurrentImage={editCurrentImage}
        downloadImage={() => downloadImage(generatedImage)}
      />
       {isModalOpen && generatedImage && (
        <MobileModal 
          image={generatedImage}
          onEdit={editCurrentImage}
          onDownload={() => downloadImage(generatedImage)}
          onNewImage={newImageFromModal}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;