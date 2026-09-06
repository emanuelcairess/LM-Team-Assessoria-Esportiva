import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  X,
  History,
  UserCheck,
  Trash2,
  UserPlus,
  RefreshCw,
  Clock,
  KeyRound,
  FileText,
  Search,
  CheckCircle2
} from 'lucide-react';
import { AuditLog } from '../types';
import { adminService } from '../services/adminService';
import { soundFx } from '../utils/audio';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Error loading audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.action.toLowerCase().includes(q) ||
      l.resource.toLowerCase().includes(q) ||
      l.resourceId.toLowerCase().includes(q) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
      (l.actorUid && l.actorUid.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q))
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE_PRESCRIBER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserPlus className="w-3 h-3" /> Criar Profissional
          </span>
        );
      case 'PROMOTE_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <KeyRound className="w-3 h-3" /> Promover Admin
          </span>
        );
      case 'UPDATE_ATHLETE_ASSIGNMENTS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <UserCheck className="w-3 h-3" /> Alterar Vínculo
          </span>
        );
      case 'DELETE_RECORD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3 h-3" /> Excluir Registro
          </span>
        );
      case 'TOGGLE_STATUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <RefreshCw className="w-3 h-3" /> Alterar Status
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <FileText className="w-3 h-3" /> {action}
          </span>
        );
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR')}`;
    } catch {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Trilha de Auditoria & Governança
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Zero-Trust
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Registro imutável no backend de todas as ações administrativas, promoções e exclusões.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                fetchLogs();
              }}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
              title="Atualizar Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ação, recurso, ator UID ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {filteredLogs.length} registro(s)
          </span>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading && logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
              <p className="text-sm font-medium">Carregando trilha de auditoria autorizada...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto opacity-40 mb-3" />
              <p className="text-sm">Nenhum evento de auditoria encontrado com os filtros atuais.</p>
              <p className="text-xs text-slate-600 mt-1">Ações como cadastros, promoções e exclusões serão registradas aqui.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedLog?.id === log.id
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-lg'
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        {log.resource}:{log.resourceId}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 mt-1">{log.details || log.action}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span className="font-mono text-slate-400">
                        Ator: <span className="text-slate-300">{log.actorEmail || log.actorUid}</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-cyan-400 hover:underline shrink-0">
                    {selectedLog?.id === log.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                  </span>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedLog?.id === log.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-3 border-t border-slate-700/60 text-xs space-y-2"
                    >
                      <div className="grid grid-cols-2 gap-2 text-slate-400">
                        <div>
                          <span className="text-slate-500">Actor UID:</span>
                          <p className="font-mono text-slate-300 select-all">{log.actorUid}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Log ID:</span>
                          <p className="font-mono text-slate-300 select-all">{log.id}</p>
                        </div>
                      </div>

                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div>
                          <span className="text-slate-500 font-semibold block mb-1">Campos Alterados / Payload:</span>
                          <pre className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-cyan-300 font-mono text-[11px] overflow-x-auto select-all max-h-48">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Backend autenticado e seguro via Firebase Admin SDK
          </span>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
