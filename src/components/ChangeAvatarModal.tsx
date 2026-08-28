import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Save, Sparkles, Check, User } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { soundFx } from '../utils/audio';

interface ChangeAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  currentAvatar: string;
  onSaveAvatar: (newAvatarUrl: string) => void;
  presetAvatars?: string[];
}

export const ChangeAvatarModal: React.FC<ChangeAvatarModalProps> = ({
  isOpen,
  onClose,
  title = 'Alterar Foto de Perfil',
  subtitle = 'Selecione uma foto da sua galeria ou câmera para atualizar seu perfil.',
  currentAvatar,
  onSaveAvatar,
  presetAvatars
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);

  // Sync with prop when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(currentAvatar);
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  const handleSave = () => {
    soundFx.playSuccess();
    onSaveAvatar(selectedAvatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg rounded-3xl modal-liquid-glass border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5 z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Uploader Body */}
        <div className="py-2">
          <ImageUploader
            currentImage={selectedAvatar}
            onImageSelected={(newUrl) => setSelectedAvatar(newUrl)}
            presetAvatars={presetAvatars}
            label="Prévia da Nova Foto"
            size="lg"
            helperText="Envie uma imagem do seu dispositivo para atualizar instantaneamente sua identificação."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white text-xs font-black shadow-lg shadow-blue-950/50 transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Nova Foto</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
