import React from 'react';
import { AthleteProfile } from '../types';
import { User, ShieldAlert, Lock } from 'lucide-react';

interface AthleteModalHeaderProps {
  athlete?: AthleteProfile;
  title: string;
  subtitle?: string;
  badge?: string;
  isBlocked?: boolean;
}

export const AthleteModalHeader: React.FC<AthleteModalHeaderProps> = ({
  athlete,
  title,
  subtitle,
  badge,
  isBlocked = false
}) => {
  if (!athlete) {
    return (
      <div className="border-b border-white/10 pb-4 mb-5">
        <h3 className="text-xl font-black text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="border-b border-white/10 pb-4 mb-5 space-y-3">
      {/* Top Title & Optional Badge */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            {title}
            {isBlocked && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md font-bold">
                <Lock className="w-3 h-3" /> Bloqueado
              </span>
            )}
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {badge && (
          <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-orange-600/20 text-orange-300 border border-orange-500/30 shrink-0">
            {badge}
          </span>
        )}
      </div>

      {/* Prominent Athlete Identification Bar */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {athlete.avatar ? (
            <img
              src={athlete.avatar}
              alt={athlete.name}
              className="w-8 h-8 rounded-lg object-cover border border-orange-500/40 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-orange-600/30 text-orange-300 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-500/40">
              {athlete.name?.slice(0, 2).toUpperCase() || 'AT'}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 truncate">
              <span className="font-black text-white text-sm truncate">{athlete.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-600/30 text-orange-300 border border-orange-500/40 shrink-0">
                #{athlete.id.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {athlete.category} • {athlete.goal || 'Plano de Alta Performance'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Status: </span>
          <span className="text-emerald-400 font-bold">{athlete.status}</span>
        </div>
      </div>
    </div>
  );
};
