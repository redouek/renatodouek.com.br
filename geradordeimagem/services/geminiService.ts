import { GoogleGenAI, Modality } from "@google/genai";
import { CreateFunction, EditFunction, ImageFile, AspectRatio } from '../types';

if (!process.env.API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this environment, we assume API_KEY is set.
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const functionToPromptPrefix: Record<CreateFunction, string> = {
    [CreateFunction.Free]: '',
    [CreateFunction.Sticker]: 'Create a die-cut sticker of: ',
    [CreateFunction.Text]: 'Create a modern, vector-style logo for a company with the theme: ',
    [CreateFunction.Comic]: 'A comic book panel illustration of: ',
};

const editToPromptPrefix: Record<EditFunction, string> = {
    [EditFunction.AddRemove]: '', // User prompt is direct, e.g., "add a hat"
    [EditFunction.Retouch]: 'Perform a professional photo retouch on this image, focusing on: ',
    [EditFunction.Style]: 'Redraw this image in the style of: ',
    [EditFunction.Compose]: 'Combine the artistic style of the first image with the subject matter of the second image. The new prompt is: ',
};

export const generateImage = async (prompt: string, createFunction: CreateFunction, aspectRatio: AspectRatio, negativePrompt: string): Promise<ImageFile> => {
    const fullPrompt = `${functionToPromptPrefix[createFunction]}${prompt}`;
    
    const config: {
        numberOfImages: number;
        outputMimeType: string;
        aspectRatio: AspectRatio;
        negativePrompt?: string;
    } = {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: aspectRatio,
    };

    if (negativePrompt && negativePrompt.trim() !== '') {
        config.negativePrompt = negativePrompt;
    }

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: config,
    });

    const generatedImage = response.generatedImages[0];
    if (!generatedImage || !generatedImage.image.imageBytes) {
        throw new Error("API did not return an image.");
    }

    return {
        base64: generatedImage.image.imageBytes,
        mimeType: generatedImage.image.mimeType || 'image/png'
    };
};

export const editImage = async (prompt: string, editFunction: EditFunction, image: ImageFile): Promise<ImageFile> => {
    const fullPrompt = `${editToPromptPrefix[editFunction]}${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { inlineData: { data: image.base64, mimeType: image.mimeType } },
          { text: fullPrompt },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (!imagePart?.inlineData) {
        throw new Error("API did not return an edited image.");
    }

    return {
        base64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
    };
};


export const combineImages = async (prompt: string, image1: ImageFile, image2: ImageFile): Promise<ImageFile> => {
    const fullPrompt = `${editToPromptPrefix[EditFunction.Compose]}${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { text: "Image 1 (Style Reference):" },
          { inlineData: { data: image1.base64, mimeType: image1.mimeType } },
          { text: "Image 2 (Subject Reference):" },
          { inlineData: { data: image2.base64, mimeType: image2.mimeType } },
          { text: fullPrompt },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
     if (!imagePart?.inlineData) {
        throw new Error("API did not return a combined image.");
    }
    
    return {
        base64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
    };
}