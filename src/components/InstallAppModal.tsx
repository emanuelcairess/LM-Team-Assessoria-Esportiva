import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Download,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Globe,
  QrCode,
  Compass,
  MoreVertical,
  PlusSquare,
  Home
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallClick
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android'>('android');
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-lr6pz36raihyll7wtzibx6-677125773099.us-east1.run.app';

  useEffect(() => {
    // Detect device platform
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        setPlatform('ios');
      } else {
        setPlatform('android');
      }

      if (navigator.share) {
        setCanShare(true);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    soundFx.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      soundFx.playSuccess();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    soundFx.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LM Team - Assessoria Esportiva',
          text: 'Acesse o aplicativo oficial da LM Team no seu celular:',
          url: appUrl
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
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
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl modal-liquid-glass border border-cyan-500/30 p-5 sm:p-6 shadow-2xl overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Instalar no Celular</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-400">Tenha o app direto na tela inicial do seu celular</p>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 scrollbar-thin">
          {/* Quick Install Banner if beforeinstallprompt is active */}
          {deferredPrompt && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/30 via-cyan-600/20 to-indigo-600/30 border border-cyan-400/40 flex items-center justify-between gap-3 shadow-lg shadow-cyan-950/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instalação Automática Pronta</h4>
                  <p className="text-[11px] text-slate-300">Navegador compatível com 1 clique</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playSuccess();
                  if (onInstallClick) onInstallClick();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-md transition flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            </div>
          )}

          {/* Platform Switcher Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setPlatform('android');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                platform === 'android'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android (Samsung / Xiaomi / Motorola)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setPlatform('ios');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                platform === 'ios'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>iPhone & iPad (iOS)</span>
            </button>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Passo a Passo de Instalação no {platform === 'ios' ? 'iPhone (Safari)' : 'Android (Chrome)'}</span>
            </h4>

            {platform === 'ios' ? (
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-500/30 text-[11px]">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-white">Abra no Safari</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Acesse este link diretamente pelo navegador <strong>Safari</strong> do iPhone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-500/30 text-[11px]">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Toque no botão Compartilhar</span>
                      <Share2 className="w-3.5 h-3.5 text-blue-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      É o ícone de um quadrado com uma seta apontando para cima na barra inferior do Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-500/30 text-[11px]">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Selecione "Adicionar à Tela de Início"</span>
                      <PlusSquare className="w-3.5 h-3.5 text-cyan-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Role o menu de opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-500/30 text-[11px]">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-white">Toque em "Adicionar"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      O ícone do <strong>LM Team</strong> aparecerá na tela do seu iPhone como um app nativo, funcionando em tela cheia!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-[11px]">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-white">Abra no Chrome ou Samsung Internet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Acesse o aplicativo no navegador padrão do seu smartphone Android.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-[11px]">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Toque nos 3 pontinhos do menu</span>
                      <MoreVertical className="w-3.5 h-3.5 text-emerald-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Toque no menu de opções (canto superior direito no Chrome ou inferior no Samsung Internet).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-[11px]">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</span>
                      <Download className="w-3.5 h-3.5 text-cyan-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Toque em <strong>"Instalar aplicativo"</strong> para baixar o atalho direto do sistema.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-[11px]">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-white">Pronto!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      O app será aberto em tela cheia sem barra de navegação, com ícone próprio e suporte offline.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share & Copy Link Section */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Link do Aplicativo</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                {appUrl}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/10 transition flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copiar Link para o Celular</span>
                  </>
                )}
              </button>

              {canShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sem necessidade de loja de apps (PWA Direto)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};
