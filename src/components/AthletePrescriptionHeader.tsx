import React from 'react';
import {
  User,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Lock
} from 'lucide-react';
import { AthleteProfile, PersistenceSyncState } from '../types';

interface AthletePrescriptionHeaderProps {
  athlete: AthleteProfile;
  title: string;
  subtitle?: string;
  syncState: PersistenceSyncState;
  lastConfirmedTime?: string | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const AthletePrescriptionHeader: React.FC<AthletePrescriptionHeaderProps> = ({
  athlete,
  title,
  subtitle,
  syncState,
  lastConfirmedTime,
  errorMessage,
  onRetry,
  isLoading = false
}) => {
  return (
    <div className="space-y-2 mb-4">
      {/* Main Header Container */}
      <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Athlete Identification Section */}
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              {athlete.avatar ? (
                <img
                  src={athlete.avatar}
                  alt={athlete.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500/40 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                  {athlete.name?.slice(0, 2).toUpperCase() || 'AT'}
                </div>
              )}
              {isLoading && (
                <div
                  className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow"
                  title="Carregando dados do atleta"
                >
                  <Lock className="w-3 h-3" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-600/20 dark:bg-orange-600/30 text-orange-700 dark:text-orange-300 border border-orange-500/40">
                  ID: #{athlete.id.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10">
                  {athlete.category}
                </span>
                {athlete.goal && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20">
                    Objetivo: {athlete.goal}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
                {athlete.name}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">| {title}</span>
              </h2>

              {subtitle && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Persistent State Machine Status Indicator */}
          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Status de Persistência
            </div>

            {syncState === 'carregando' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Carregando atleta...
              </span>
            )}

            {syncState === 'sem_dados' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Sem dados cadastrados
              </span>
            )}

            {syncState === 'alterado_localmente' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30">
                <Clock className="w-3.5 h-3.5" /> Alterado localmente
              </span>
            )}

            {syncState === 'aguardando_envio' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Aguardando envio...
              </span>
            )}

            {syncState === 'salvo' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salvo{' '}
                {lastConfirmedTime ? `(${lastConfirmedTime})` : '• Confirmado'}
              </span>
            )}

            {syncState === 'falha' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Falha no envio
              </span>
            )}
          </div>
        </div>

        {/* Blocking Loading Notice */}
        {isLoading && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-300 bg-amber-500/10 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 rounded-b-2xl">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Carregando dados correspondentes de {athlete.name}. Edição temporariamente bloqueada.
              </span>
            </div>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
          </div>
        )}
      </div>

      {/* Persistent Error Alert with Retry button */}
      {syncState === 'falha' && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold text-rose-100">
                Ocorreu uma falha na persistência remota
              </p>
              <p className="text-[11px] text-rose-300">
                {errorMessage ||
                  'Não foi possível confirmar a sincronização com o Firestore. Os dados permanecem salvos em cache offline.'}
              </p>
            </div>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition shadow shrink-0 self-end sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Tentar novamente
            </button>
          )}
        </div>
      )}
    </div>
  );
};
