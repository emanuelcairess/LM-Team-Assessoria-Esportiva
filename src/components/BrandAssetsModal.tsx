import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Copy,
  Check,
  Smartphone,
  Layers,
  Sparkles,
  Shield,
  Palette,
  ExternalLink,
  Eye,
  FileCode,
  Image,
  Monitor
} from 'lucide-react';
import { TeamLmBrand } from './TeamLmBrand';
import { soundFx } from '../utils/audio';

interface BrandAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const BrandAssetsModal: React.FC<BrandAssetsModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark'
}) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'icons' | 'palette' | 'mockup'>('icons');
  const [showSplashPreview, setShowSplashPreview] = useState<boolean>(false);

  if (!isOpen) return null;

  const colorPalette = [
    { name: 'Ouro Metálico (Dourado Primário)', hex: '#E5B045', rgb: '229, 176, 69', usage: 'Emblema Leão, Títulos e Detalhes Ouro' },
    { name: 'Ouro Brilhante (Specular Highlight)', hex: '#FEF08A', rgb: '254, 240, 138', usage: 'Reflexos e facetas de alta luminosidade' },
    { name: 'Púrpura Imperial (Letra M)', hex: '#A855F7', rgb: '168, 85, 247', usage: 'Monograma M, Badges e Acentos Violeta' },
    { name: 'Violeta Metálico Escuro', hex: '#581C87', rgb: '88, 28, 135', usage: 'Sombreamento 3D da Letra M' },
    { name: 'Fibra de Carbono Dark', hex: '#080A0F', rgb: '8, 10, 15', usage: 'Fundo dos Ícones e Cartões Squircle' },
    { name: 'Azul Abissal Liquid', hex: '#070A13', rgb: '7, 10, 19', usage: 'Canvas Principal Noturno' },
    { name: 'Ciano Neônio (Acentos)', hex: '#38BDF8', rgb: '56, 189, 248', usage: 'Indicadores e Status de Atividade' }
  ];

  const handleCopyColor = (hex: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleDownloadSvg = async () => {
    soundFx.playClick();
    try {
      const response = await fetch('/icon.svg');
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'team-lm-app-icon.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopySvgCode = async () => {
    soundFx.playClick();
    try {
      const response = await fetch('/icon.svg');
      const svgText = await response.text();
      navigator.clipboard.writeText(svgText);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPng = async (size: number, filename: string) => {
    soundFx.playClick();
    setDownloading(filename);
    try {
      const response = await fetch('/icon.svg');
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, size, size);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
        setDownloading(null);
      };
      img.src = url;
    } catch (e) {
      console.error(e);
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl rounded-3xl modal-liquid-glass border border-amber-500/30 shadow-2xl p-6 sm:p-8 space-y-6 z-10 my-8 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <TeamLmBrand size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Ícones & Identidade Visual Team LM
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Alta Fidelidade 3D
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ícones oficiais gerados com base na referência de Leão 3D Dourado, Fibra de Carbono e One UI 9.0.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => setActiveTab('icons')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'icons'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Ícones & Download
          </button>
          <button
            onClick={() => setActiveTab('mockup')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'mockup'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Simulação Mobile (One UI 9.0)
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Escalas do Logo
          </button>
          <button
            onClick={() => setActiveTab('palette')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'palette'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            Cores & Tokens
          </button>
        </div>

        {/* TAB 1: ICONS & DOWNLOAD */}
        {activeTab === 'icons' && (
          <div className="space-y-6">
            {/* Main Icon Showcase */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-[#0a0d14] to-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

              {/* High-res App Icon Preview */}
              <div className="shrink-0 relative group">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[28%] overflow-hidden shadow-2xl shadow-black/90 border border-amber-400/40 p-1 bg-black/60 relative">
                  <img
                    src="/icon.svg"
                    alt="App Icon Team LM"
                    className="w-full h-full object-contain rounded-[26%]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 rounded-[28%] ring-1 ring-inset ring-white/20 pointer-events-none" />
                </div>
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                  512 × 512 HD
                </span>
              </div>

              {/* Icon Details & Primary Action Buttons */}
              <div className="space-y-3 flex-1 text-center md:text-left z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Ícone Oficial Renderizado em Vetor 3D
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Team LM Consultoria App Icon
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Modelagem vetorial de alta precisão com leão dourado esculpido em relevo 3D, tipografia <strong className="text-amber-300">TEAM LM</strong> e <strong className="text-amber-200">CONSULTORIA</strong> sobre textura tátil diagonal de fibra de carbono aeroespacial e acabamento Liquid Glass One UI 9.0.
                </p>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/40 transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar SVG Master (Vetor)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPng(1024, 'team-lm-icon-1024.png')}
                    disabled={downloading !== null}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 transition active:scale-95"
                  >
                    <Image className="w-4 h-4 text-amber-400" />
                    <span>{downloading === 'team-lm-icon-1024.png' ? 'Gerando PNG...' : 'Baixar PNG Ultra HD (1024px)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySvgCode}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition"
                  >
                    {copiedSvg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copiedSvg ? 'Código Copiado!' : 'Copiar SVG'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Export Grid for Mobile & Web Packs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Formatos de Exportação para Lojas e Dispositivos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 512x512 */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center shrink-0">
                      <img src="/icon.svg" alt="512" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">App Store & Play Store</p>
                      <p className="text-[10px] text-slate-400">512 × 512 PNG</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPng(512, 'team-lm-icon-512.png')}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar 512px</span>
                  </button>
                </div>

                {/* 192x192 */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center shrink-0">
                      <img src="/icon.svg" alt="192" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">PWA Mobile Icon</p>
                      <p className="text-[10px] text-slate-400">192 × 192 PNG</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPng(192, 'team-lm-icon-192.png')}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar 192px</span>
                  </button>
                </div>

                {/* Favicon 32x32 */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center shrink-0">
                      <img src="/favicon.svg" alt="Favicon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Favicon Web</p>
                      <p className="text-[10px] text-slate-400">32 × 32 PNG & SVG</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPng(32, 'favicon-32.png')}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar 32px</span>
                  </button>
                </div>

                {/* Splash Screen */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Splash Screen One UI</p>
                      <p className="text-[10px] text-slate-400">Tela de Abertura</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setShowSplashPreview(true);
                      setTimeout(() => setShowSplashPreview(false), 2400);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar Splash</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MOBILE SIMULATION / MOCKUP */}
        {activeTab === 'mockup' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Simulated Samsung One UI 9.0 / Android Home Screen */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 flex flex-col items-center text-center space-y-4">
                <div className="w-full flex items-center justify-between px-2 text-[10px] text-slate-400 font-bold">
                  <span>SAMSUNG ONE UI 9.0</span>
                  <span className="text-amber-400">Adaptive Squircle</span>
                </div>

                {/* Mockup Frame */}
                <div className="w-64 h-96 rounded-[36px] bg-gradient-to-b from-slate-900 via-[#070a13] to-slate-950 border-4 border-slate-700/60 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono px-2">
                    <span>10:45</span>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* App Grid */}
                  <div className="grid grid-cols-4 gap-3 pt-6">
                    {/* Team LM Icon Highlighted */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-11 h-11 rounded-[22%] shadow-lg shadow-black/80 overflow-hidden ring-2 ring-amber-400/80 animate-pulse">
                        <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[9px] font-black text-amber-300 truncate max-w-[50px]">Team LM</span>
                    </div>

                    {/* Placeholder companion apps */}
                    <div className="flex flex-col items-center gap-1 opacity-40">
                      <div className="w-11 h-11 rounded-[22%] bg-blue-600 flex items-center justify-center text-white text-xs font-bold">G</div>
                      <span className="text-[9px] text-slate-400">Galeria</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                      <div className="w-11 h-11 rounded-[22%] bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">W</div>
                      <span className="text-[9px] text-slate-400">Saúde</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                      <div className="w-11 h-11 rounded-[22%] bg-purple-600 flex items-center justify-center text-white text-xs font-bold">M</div>
                      <span className="text-[9px] text-slate-400">Música</span>
                    </div>
                  </div>

                  {/* Dock */}
                  <div className="rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-around">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/40" />
                    <div className="w-8 h-8 rounded-xl bg-green-500/40" />
                    <div className="w-8 h-8 rounded-xl bg-orange-500/40" />
                    <div className="w-8 h-8 rounded-xl bg-amber-500/80 ring-1 ring-amber-300" />
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Renderização nativa no formato Squircle One UI com sombras de profundidade.
                </p>
              </div>

              {/* Simulated iOS Home Screen */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 flex flex-col items-center text-center space-y-4">
                <div className="w-full flex items-center justify-between px-2 text-[10px] text-slate-400 font-bold">
                  <span>APPLE iOS 18+</span>
                  <span className="text-purple-400">Smooth Corner Radius</span>
                </div>

                {/* Mockup Frame */}
                <div className="w-64 h-96 rounded-[40px] bg-gradient-to-b from-slate-900 via-[#070a13] to-slate-950 border-4 border-slate-700/60 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  {/* Dynamic Island */}
                  <div className="w-20 h-4 rounded-full bg-black mx-auto" />

                  {/* App Grid */}
                  <div className="grid grid-cols-4 gap-3 pt-4">
                    {/* Team LM Icon */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-11 h-11 rounded-[24%] shadow-xl shadow-black/80 overflow-hidden ring-1 ring-white/30">
                        <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[9px] font-bold text-white truncate max-w-[50px]">Team LM</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 opacity-40">
                      <div className="w-11 h-11 rounded-[24%] bg-slate-800" />
                      <span className="text-[9px] text-slate-400">Fotos</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                      <div className="w-11 h-11 rounded-[24%] bg-slate-800" />
                      <span className="text-[9px] text-slate-400">Notas</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                      <div className="w-11 h-11 rounded-[24%] bg-slate-800" />
                      <span className="text-[9px] text-slate-400">Ajustes</span>
                    </div>
                  </div>

                  {/* iOS Dock */}
                  <div className="rounded-[24px] bg-white/10 backdrop-blur-md p-2 flex items-center justify-around">
                    <div className="w-9 h-9 rounded-2xl bg-white/20" />
                    <div className="w-9 h-9 rounded-2xl bg-white/20" />
                    <div className="w-9 h-9 rounded-2xl bg-white/20" />
                    <div className="w-9 h-9 rounded-2xl bg-white/20" />
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Compatível com Web Clip e PWA Standalone no Safari e Chrome.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOGO SCALES / OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Escalas de Aplicação do Emblema
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 text-center">
                  <TeamLmBrand size="xs" showText={false} />
                  <span className="text-[11px] font-bold text-slate-300">28px (Favicon/Barra)</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 text-center">
                  <TeamLmBrand size="sm" showText={false} />
                  <span className="text-[11px] font-bold text-slate-300">38px (Navegação)</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 text-center">
                  <TeamLmBrand size="md" showText={false} />
                  <span className="text-[11px] font-bold text-slate-300">48px (Cards & Header)</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 text-center">
                  <TeamLmBrand size="lg" showText={false} />
                  <span className="text-[11px] font-bold text-slate-300">64px (Login & Modais)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COLOR PALETTE */}
        {activeTab === 'palette' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Clique em qualquer cor para copiar o código hexadecimal para sua área de transferência.
            </p>
            <div className="space-y-2">
              {colorPalette.map((color) => (
                <div
                  key={color.hex}
                  onClick={() => handleCopyColor(color.hex)}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-4 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl border border-white/20 shadow-inner shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                        {color.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{color.usage}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-black/40 px-2 py-1 rounded-lg">
                      {color.hex}
                    </span>
                    <button className="p-1.5 rounded-lg bg-white/10 text-slate-300 group-hover:text-white">
                      {copiedColor === color.hex ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>Identidade e Assets integrados ao ecossistema do app.</span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg transition"
          >
            Concluir
          </button>
        </div>
      </motion.div>

      {/* Full Splash Preview overlay on demand */}
      {showSplashPreview && (
        <div className="fixed inset-0 z-[100]">
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/30 via-purple-600/20 to-transparent rounded-full blur-xl animate-pulse" />
              <TeamLmBrand size="hero" showText={false} animated />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                TEAM LM CONSULTORIA
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Assessoria Esportiva & Performance Humana
              </p>
            </div>
            <div className="w-56 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-amber-400 to-purple-500 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

