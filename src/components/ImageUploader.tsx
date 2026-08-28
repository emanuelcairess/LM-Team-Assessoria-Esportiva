import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Upload,
  Sparkles,
  Link,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Crop,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { compressImageFile, isImageFile } from '../utils/imageCompressor';
import { AvatarCropModal } from './AvatarCropModal';
import { soundFx } from '../utils/audio';

interface ImageUploaderProps {
  currentImage: string;
  onImageSelected: (dataUrl: string) => void;
  presetAvatars?: string[];
  label?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  allowUrlInput?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageSelected,
  presetAvatars = [],
  label = 'Foto de Perfil',
  helperText = 'Envie uma foto do seu dispositivo (JPG, PNG, WebP) e ajuste o enquadramento do rosto.',
  size = 'md',
  allowUrlInput = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  
  // Crop & Adjust modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  const avatarSizes = {
    sm: 'w-14 h-14 rounded-2xl',
    md: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl',
    lg: 'w-28 h-28 sm:w-32 sm:h-32 rounded-3xl'
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!isImageFile(file)) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP, GIF, etc).');
      soundFx.playRestAlert();
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // First compress / prepare high-res source for cropping
      const dataUrl = await compressImageFile(file, 800, 0.9);
      setImageToCrop(dataUrl);
      setIsCropModalOpen(true);
      soundFx.playClick();
    } catch (err: any) {
      console.error('Error processing image:', err);
      setErrorMessage(err?.message || 'Erro ao processar e carregar a foto.');
      soundFx.playRestAlert();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
    // Reset file input value to allow selecting the same file again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setImageToCrop(customUrlInput.trim());
    setIsCropModalOpen(true);
    setShowUrlModal(false);
    setCustomUrlInput('');
  };

  const handleCropConfirm = (croppedDataUrl: string) => {
    setIsCropModalOpen(false);
    onImageSelected(croppedDataUrl);
    soundFx.playSuccess();
  };

  const handleOpenCropForCurrent = () => {
    if (!currentImage) return;
    soundFx.playClick();
    setImageToCrop(currentImage);
    setIsCropModalOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Header Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] text-slate-400">Enquadramento com Zoom & Rotação</span>
        </div>
      )}

      {/* Main Upload Control Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md">
        {/* Avatar Preview with Camera Overlay */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            soundFx.playClick();
            fileInputRef.current?.click();
          }}
          className={`relative group cursor-pointer shrink-0 transition-all ${
            avatarSizes[size]
          } ${
            isDragging
              ? 'ring-4 ring-cyan-400 scale-105 shadow-xl shadow-cyan-500/40'
              : 'ring-2 ring-white/20 hover:ring-cyan-400/80 shadow-lg'
          }`}
          title="Clique ou arraste uma foto para alterar"
        >
          {currentImage ? (
            <img
              src={currentImage}
              alt="Foto Selecionada"
              className="w-full h-full object-cover rounded-[inherit]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 rounded-[inherit]">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}

          {/* Hover / Drag Overlay */}
          <div
            className={`absolute inset-0 rounded-[inherit] bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white transition-opacity ${
              isDragging || isProcessing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 text-cyan-300 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-cyan-300 mb-0.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-200">
                  {isDragging ? 'Solte Aqui' : 'Alterar'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Upload Buttons and Actions */}
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-xs text-slate-300 leading-snug">{helperText}</p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Upload from Device Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                soundFx.playClick();
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-950/40 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-cyan-200" />
              )}
              <span>{isProcessing ? 'Processando...' : 'Enviar Foto'}</span>
            </button>

            {/* Adjust / Crop current image button */}
            {currentImage && (
              <button
                type="button"
                onClick={handleOpenCropForCurrent}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5"
                title="Ajustar zoom, rotação e enquadramento do rosto"
              >
                <Crop className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ajustar Rosto</span>
              </button>
            )}

            {/* Custom URL Option */}
            {allowUrlInput && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowUrlModal(!showUrlModal);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition flex items-center gap-1"
                title="Inserir link direto de imagem"
              >
                <Link className="w-3 h-3 text-slate-400" />
                <span>Link / URL</span>
              </button>
            )}

            {/* Reset / Randomize if presets exist */}
            {presetAvatars.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  const randomPreset =
                    presetAvatars[Math.floor(Math.random() * presetAvatars.length)];
                  onImageSelected(randomPreset);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-white/5 transition flex items-center gap-1"
                title="Sortear avatar dos modelos padrão"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Sortear</span>
              </button>
            )}
          </div>

          {/* URL Input Form (toggled) */}
          {showUrlModal && (
            <form onSubmit={handleApplyCustomUrl} className="flex items-center gap-1.5 mt-2">
              <input
                type="url"
                placeholder="Cole a URL da imagem (https://...)"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-white text-xs placeholder:text-slate-500 outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
              >
                Ajustar
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Preset Avatars Row (if provided) */}
      {presetAvatars.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Ou escolha um dos modelos predefinidos:</span>
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {presetAvatars.map((url, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => {
                  soundFx.playClick();
                  onImageSelected(url);
                }}
                className={`w-10 h-10 rounded-xl overflow-hidden ring-2 transition-all transform shrink-0 ${
                  currentImage === url
                    ? 'ring-cyan-400 scale-105 shadow-md shadow-cyan-900/50'
                    : 'ring-white/10 opacity-60 hover:opacity-100'
                }`}
                title={`Modelo ${idx + 1}`}
              >
                <img src={url} alt={`Modelo ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Feedback */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Crop & Face Framing Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={imageToCrop}
        onClose={() => setIsCropModalOpen(false)}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
};
