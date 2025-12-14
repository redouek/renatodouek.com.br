
import React from 'react';
import { ImageFile } from '../types';

interface MobileModalProps {
    image: ImageFile;
    onEdit: () => void;
    onDownload: () => void;
    onNewImage: () => void;
    onClose: () => void;
}

const MobileModal: React.FC<MobileModalProps> = ({ image, onEdit, onDownload, onNewImage, onClose }) => {
    return (
        <div 
            id="mobileModal" 
            className="mobile-modal fixed inset-0 bg-black/80 flex items-center justify-center z-50 md:hidden"
            onClick={onClose}
        >
            <div 
                className="modal-content bg-panel-bg rounded-lg p-4 w-11/12 max-w-md flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    id="modalImage"
                    src={`data:${image.mimeType};base64,${image.base64}`}
                    alt="Generated Art"
                    className="modal-image w-full h-auto object-contain rounded-lg max-h-[60vh]"
                />
                <div id="modal-actions" className="modal-actions grid grid-cols-3 gap-2">
                    <button className="modal-btn edit bg-input-bg hover:bg-border-color py-3 rounded-md" onClick={onEdit}>✏️ Editar</button>
                    <button className="modal-btn download bg-input-bg hover:bg-border-color py-3 rounded-md" onClick={onDownload}>💾 Salvar</button>
                    <button className="modal-btn new bg-accent hover:bg-accent-hover py-3 rounded-md" onClick={onNewImage}>✨ Nova Imagem</button>
                </div>
            </div>
        </div>
    );
};

export default MobileModal;
