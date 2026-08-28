import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  RotateCcw as ResetIcon,
  Check,
  X,
  Move,
  Camera,
  Sparkles,
  Crop,
  Layers
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirm: (croppedDataUrl: string) => void;
  title?: string;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
  title = 'Ajustar e Enquadrar Foto'
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset transforms whenever a new image is loaded
  useEffect(() => {
    if (isOpen && imageSrc) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setFlipX(false);
      setPreviewDataUrl(imageSrc);
    }
  }, [isOpen, imageSrc]);

  // Load natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    soundFx.playClick();
    setScale((prev) => Math.min(prev + 0.15, 3.5));
  };

  const handleZoomOut = () => {
    soundFx.playClick();
    setScale((prev) => Math.max(prev - 0.15, 0.6));
  };

  const handleRotate = () => {
    soundFx.playClick();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlip = () => {
    soundFx.playClick();
    setFlipX((prev) => !prev);
  };

  const handleReset = () => {
    soundFx.playClick();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setFlipX(false);
  };

  // Generate cropped image on canvas
  const generateCroppedImage = useCallback(() => {
    if (!imageRef.current || !imageSrc) return null;

    const img = imageRef.current;
    const outputSize = 400; // Output square dimension
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill background with neutral dark
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Frame size inside UI is 240px
    const uiFrameSize = 240;
    const scaleFactor = outputSize / uiFrameSize;

    ctx.save();
    // Move to center of canvas
    ctx.translate(outputSize / 2, outputSize / 2);

    // Apply translation from UI
    ctx.translate(position.x * scaleFactor, position.y * scaleFactor);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flip
    ctx.scale(flipX ? -1 : 1, 1);

    // Calculate dimensions to maintain aspect ratio relative to UI
    const naturalWidth = img.naturalWidth || 400;
    const naturalHeight = img.naturalHeight || 400;
    const minSide = Math.min(naturalWidth, naturalHeight);
    const aspect = naturalWidth / naturalHeight;

    let baseDrawW: number;
    let baseDrawH: number;

    if (aspect >= 1) {
      baseDrawH = outputSize;
      baseDrawW = outputSize * aspect;
    } else {
      baseDrawW = outputSize;
      baseDrawH = outputSize / aspect;
    }

    const drawW = baseDrawW * scale;
    const drawH = baseDrawH * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.85);
  }, [imageSrc, scale, position, rotation, flipX]);

  const handleConfirm = () => {
    soundFx.playSuccess();
    const finalDataUrl = generateCroppedImage();
    if (finalDataUrl) {
      onConfirm(finalDataUrl);
    } else {
      onConfirm(imageSrc);
    }
  };

  if (!isOpen) return null;

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

      {/* Dialog Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        className="relative w-full max-w-md rounded-3xl liquid-glass border border-cyan-500/30 p-5 sm:p-6 shadow-2xl bg-slate-900/95 overflow-hidden z-10 flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{title}</h3>
              <p className="text-xs text-slate-400">Arraste e dê zoom para enquadrar o rosto</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Framing & Crop Viewport */}
        <div className="py-4 flex flex-col items-center justify-center shrink-0">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-60 h-60 sm:w-64 sm:h-64 rounded-3xl bg-slate-950 border-2 border-cyan-500/40 overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center"
          >
            {/* The transformed image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Foto para Ajuste"
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute max-w-none pointer-events-none transition-transform duration-75 origin-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${flipX ? -scale : scale}, ${scale})`,
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Subtle Rule-of-Thirds Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* Circular Vignette / Mask Ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/60 pointer-events-none shadow-[0_0_0_9999px_rgba(7,10,19,0.55)]" />

            {/* Center Crosshair / Face Center Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-16 h-16 rounded-full border border-dashed border-cyan-300" />
            </div>

            {/* Drag Hint Pill */}
            <div className="absolute bottom-2.5 px-2.5 py-1 rounded-full bg-slate-950/70 border border-white/15 text-[10px] font-semibold text-cyan-300 flex items-center gap-1 backdrop-blur-xs pointer-events-none">
              <Move className="w-3 h-3 text-cyan-400" />
              <span>Arraste para mover</span>
            </div>
          </div>
        </div>

        {/* Interactive Controls (Zoom & Transformations) */}
        <div className="space-y-3.5 pt-1 flex-1 overflow-y-auto">
          {/* Zoom Slider */}
          <div className="space-y-1.5 bg-black/30 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zoom / Escala</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400">{Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 transition"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.6"
                max="3.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 transition"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transform Action Buttons (Rotate, Flip, Reset) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition flex items-center justify-center gap-1.5"
              title="Girar 90°"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Girar</span>
            </button>

            <button
              type="button"
              onClick={handleFlip}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition flex items-center justify-center gap-1.5"
              title="Inverter Horizontalmente"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inverter</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition flex items-center justify-center gap-1.5"
              title="Centralizar e Redefinir"
            >
              <ResetIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Resetar</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5 shrink-0 mt-3">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-900/40 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar Enquadramento</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
