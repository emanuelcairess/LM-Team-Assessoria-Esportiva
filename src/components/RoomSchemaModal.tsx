import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  X,
  Copy,
  Check,
  Code2,
  Table,
  FileCode,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Search,
  ExternalLink,
  Zap,
  Cloud,
  CloudOff,
  RefreshCw,
  Server,
  Smartphone,
  ArrowDownUp,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { ROOM_ENTITIES_DATA, RoomEntityMetadata } from '../models/roomSchema';
import { CloudSyncStatus, PendingSyncItem } from '../types';
import { soundFx } from '../utils/audio';
import { syncService, SyncLogEntry } from '../services/syncService';

interface RoomSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus?: CloudSyncStatus;
  onTriggerSync?: () => void;
  onToggleOnlineMode?: () => void;
}

type CodeTab = 'kotlin' | 'dao' | 'sql';

export const RoomSchemaModal: React.FC<RoomSchemaModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  onTriggerSync,
  onToggleOnlineMode
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>(ROOM_ENTITIES_DATA[0].id);
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('kotlin');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'entities' | 'architecture' | 'queue'>('entities');
  const [cloudProvider, setCloudProvider] = useState<'Supabase' | 'Firestore'>('Supabase');

  if (!isOpen) return null;

  const currentEntity = ROOM_ENTITIES_DATA.find((e) => e.id === selectedEntityId) || ROOM_ENTITIES_DATA[0];

  const filteredEntities = ROOM_ENTITIES_DATA.filter(
    (e) =>
      e.moduleName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      e.tableName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      e.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getCodeContent = () => {
    switch (activeCodeTab) {
      case 'kotlin':
        return currentEntity.kotlinEntityCode;
      case 'dao':
        return currentEntity.kotlinDaoCode;
      case 'sql':
        return currentEntity.sqlDdl;
      default:
        return currentEntity.kotlinEntityCode;
    }
  };

  const handleCopy = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(getCodeContent());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl rounded-3xl modal-liquid-glass border border-white/20 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-teal-400 p-0.5 shadow-lg shadow-blue-900/30 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-teal-400">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Arquitetura Offline-First & Room Database
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Room 2.6+ ⇄ {cloudProvider}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sincronização em nuvem de Prescrições (Professor) e Check-ins (Aluno) com Room como SSOT Local.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tab Switcher */}
            <div className="hidden sm:flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveViewTab('entities');
                }}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeViewTab === 'entities'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Modelos & DAOs
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveViewTab('architecture');
                }}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeViewTab === 'architecture'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fluxo de Sync
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveViewTab('queue');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                  activeViewTab === 'queue'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Fila de Sync</span>
                {syncStatus && syncStatus.pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    {syncStatus.pendingCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Sync Status Bar */}
        {syncStatus && (
          <div className="px-6 py-2.5 bg-slate-900/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Status da Conexão:</span>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    if (onToggleOnlineMode) onToggleOnlineMode();
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                    syncStatus.isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                  }`}
                  title="Clique para alternar simulação Online/Offline"
                >
                  {syncStatus.isOnline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Online (Conectado)</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modo Offline (Room Local)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Backend Remoto:</span>
                <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/10">
                  <button
                    onClick={() => setCloudProvider('Supabase')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      cloudProvider === 'Supabase'
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Supabase (PostgreSQL)
                  </button>
                  <button
                    onClick={() => setCloudProvider('Firestore')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      cloudProvider === 'Firestore'
                        ? 'bg-amber-500/30 text-amber-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Firebase Firestore
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-slate-400 text-[11px]">
                Último Sync: <span className="text-slate-200 font-medium">{syncStatus.lastSyncedAt || 'Agora'}</span>
              </div>

              {onTriggerSync && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onTriggerSync();
                  }}
                  disabled={syncStatus.isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 1: Entities & DAOs Code Inspector */}
        {activeViewTab === 'entities' && (
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
            {/* Left Sidebar: Modules List */}
            <div className="md:col-span-4 border-r border-white/10 p-4 space-y-3 bg-slate-950/40 flex flex-col overflow-y-auto max-h-[70vh]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar entidades e DAOs..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="space-y-1.5 flex-1">
                {filteredEntities.map((ent) => {
                  const isSelected = ent.id === currentEntity.id;
                  return (
                    <button
                      key={ent.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedEntityId(ent.id);
                      }}
                      className={`w-full text-left p-3 rounded-2xl transition border ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600/30 to-teal-600/20 text-white border-teal-500/40 shadow-lg shadow-teal-950/30'
                          : 'hover:bg-white/5 text-slate-300 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold leading-snug">{ent.moduleName}</p>
                        {isSelected && <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        table: <span className="text-teal-300 font-semibold">{ent.tableName}</span>
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Offline-First Architecture Highlight */}
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Offline-First (Room SSOT)</span>
                </div>
                <p className="text-[10px] text-indigo-300/80 mt-1 leading-relaxed">
                  O Room é a fonte única da verdade. Todas as leituras e escritas ocorrem no SQLite local antes de disparar o sync assíncrono via Coroutines/WorkManager.
                </p>
              </div>
            </div>

            {/* Right Panel: Code Viewer */}
            <div className="md:col-span-8 p-5 flex flex-col overflow-y-auto max-h-[70vh] bg-slate-900/50">
              {/* Meta badges */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{currentEntity.moduleName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {currentEntity.tableName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    PK: <span className="font-mono text-slate-200">{currentEntity.primaryKey}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentEntity.description}
                </p>

                {currentEntity.foreignKeys.length > 0 && (
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400 font-semibold">Foreign Keys:</span>
                    {currentEntity.foreignKeys.map((fk, i) => (
                      <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {fk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Code Tabs Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setActiveCodeTab('kotlin');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeCodeTab === 'kotlin'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Kotlin @Entity</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setActiveCodeTab('dao');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeCodeTab === 'dao'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Kotlin @Dao & Repository</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setActiveCodeTab('sql');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeCodeTab === 'sql'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>SQL Schema & RLS</span>
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white border border-white/15 transition shadow"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Block Window */}
              <div className="relative rounded-2xl bg-slate-950/90 border border-white/10 p-4 font-mono text-[11px] sm:text-xs text-slate-200 overflow-x-auto shadow-inner flex-1 leading-relaxed">
                <pre>
                  <code>{getCodeContent()}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Architecture Flow Diagram */}
        {activeViewTab === 'architecture' && (
          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Flow 1: Prescriptions (Coach -> Cloud -> Room -> UI) */}
              <div className="p-5 rounded-3xl bg-slate-950/60 border border-blue-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">1. Fluxo de Prescrições (Autoridade do Treinador/Médico)</h3>
                    <p className="text-xs text-blue-300">Treinos periodizados, dietas e fórmulas manipuladas</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-slate-200"><strong>Coach / Médico / Nutri</strong> salva prescrição no painel web/admin conectado ao Supabase/Firestore.</p>
                  </div>
                  <div className="flex justify-center text-blue-400">
                    <ArrowDownUp className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-slate-200"><strong>PrescriptionSyncRepository</strong> emite o cache Room imediatamente (0ms) e baixa deltas da nuvem via Coroutines Flow.</p>
                  </div>
                  <div className="flex justify-center text-blue-400">
                    <ArrowDownUp className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                    <p className="text-slate-200"><strong>Room SQLite</strong> armazena dados em transação atômica <span className="font-mono text-teal-300">@Transaction</span> e atualiza a UI do aluno de forma reativa.</p>
                  </div>
                </div>
              </div>

              {/* Flow 2: Check-ins (Athlete -> Room -> SyncQueue -> Cloud) */}
              <div className="p-5 rounded-3xl bg-slate-950/60 border border-teal-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">2. Fluxo de Check-ins (Execução do Aluno)</h3>
                    <p className="text-xs text-teal-300">Séries feitas, peso erguido, RPE, refeições e ingestão de manipulados</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-slate-200"><strong>Aluno</strong> marca série concluída ou refeição. Salva imediatamente no Room com <span className="font-mono text-amber-300">PENDING_UPDATE</span>.</p>
                  </div>
                  <div className="flex justify-center text-teal-400">
                    <ArrowDownUp className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-slate-200"><strong>SyncQueueDao</strong> enfileira a mutação atômica em JSON na tabela <span className="font-mono text-teal-300">sync_queue</span>.</p>
                  </div>
                  <div className="flex justify-center text-teal-400">
                    <ArrowDownUp className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                    <p className="text-slate-200"><strong>WorkManager / SyncWorker</strong> detecta conexão de rede e realiza push em lote para o Supabase/Firestore, marcando <span className="font-mono text-emerald-300">SYNCED</span>.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict Resolution Strategy Box */}
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <span>Estratégia de Resolução de Conflitos (Conflict Resolution)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-bold text-blue-300">Prescrições: Server Authority / Last-Write-Wins</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    O treinador e a equipe médica possuem soberania sobre treinos e dietas. Versões mais recentes na nuvem sobrescrevem prescrições locais via carimbo temporal (<span className="font-mono text-slate-200">server_version</span>).
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-bold text-teal-300">Check-ins: Client Delta Queue / Append-Only</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Os registros de carga, RPE e refeições do aluno nunca são sobrescritos pelo treinador. São enviados como eventos delta imutáveis com UUIDs únicos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pending Sync Queue Buffer & Firestore Dispatcher */}
        {activeViewTab === 'queue' && (
          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            {/* Header with Control Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Fila de Mutações Offline (Tabela: sync_queue)</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Firebase Firestore
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check-ins registrados localmente no Room com push automático ao detectar conectividade.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    if (onToggleOnlineMode) {
                      onToggleOnlineMode();
                    } else {
                      syncService.setOnline(!syncStatus?.isOnline);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    syncStatus?.isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  {syncStatus?.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  <span>{syncStatus?.isOnline ? 'Online (Ativo)' : 'Offline (Simulado)'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    syncService.enqueueMutation(
                      'checkin_exercise_set',
                      `set_${Date.now().toString().slice(-4)}`,
                      {
                        exerciseName: 'Supino Inclinado com Halteres',
                        setNumber: 3,
                        weightKg: 38,
                        reps: 10,
                        rpe: 9.0,
                        timestamp: Date.now()
                      }
                    );
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition"
                  title="Simular registro de série no treino"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>+ Testar Check-in</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    if (onTriggerSync) {
                      onTriggerSync();
                    } else {
                      syncService.flushPendingQueueToFirestore();
                    }
                  }}
                  disabled={syncStatus?.isSyncing || (syncStatus?.pendingCount === 0 && syncStatus?.isOnline)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus?.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{syncStatus?.isSyncing ? 'Enviando...' : 'Forçar Sync Firestore'}</span>
                </button>
              </div>
            </div>

            {/* Sync Queue Table / Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Mutações Pendentes na Fila ({syncStatus?.pendingCount || 0})
                </span>
                {syncStatus && syncStatus.checkInSyncQueue.length > 0 && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      syncService.clearQueue();
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Limpar Fila</span>
                  </button>
                )}
              </div>

              {syncStatus && syncStatus.checkInSyncQueue.length > 0 ? (
                <div className="space-y-2.5">
                  {syncStatus.checkInSyncQueue.map((item) => {
                    let firestoreCollection = `athletes/ath_01/checkins`;
                    if (item.domain === 'checkin_exercise_set') {
                      firestoreCollection = `athletes/ath_01/exercise_set_checkins`;
                    } else if (item.domain === 'checkin_meal') {
                      firestoreCollection = `athletes/ath_01/meal_checkins`;
                    } else if (item.domain === 'checkin_supplement') {
                      firestoreCollection = `athletes/ath_01/supplement_checkins`;
                    } else if (item.domain === 'checkin_anthropometric') {
                      firestoreCollection = `athletes/ath_01/anthropometric_evaluations`;
                    }

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                            {item.operation}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-white font-mono">{item.domain}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300">
                                doc: {item.entityId}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                ➔ Firestore: /{firestoreCollection}/{item.entityId}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono break-all line-clamp-2">
                              payload: {item.payloadJson}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>AGUARDANDO CONEXÃO</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-950/40 border border-white/10 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Fila de Sincronização Zerada</h4>
                    <p className="text-[11px] text-slate-400 max-w-md mt-0.5">
                      Todos os check-ins e mutações foram gravados no Firebase Firestore com sucesso.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Firestore Sync Logs Feed */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <h4 className="text-xs font-bold text-white">Log de Execução em Tempo Real (SyncService)</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {syncStatus?.lastSyncedAt || 'Nenhum sync recente'}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {syncService.getLogs().length > 0 ? (
                  syncService.getLogs().map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5 text-[11px] font-mono"
                    >
                      <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                          log.type === 'SYNC_SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : log.type === 'ONLINE'
                            ? 'bg-blue-500/20 text-blue-300'
                            : log.type === 'OFFLINE'
                            ? 'bg-amber-500/20 text-amber-300'
                            : log.type === 'ENQUEUE'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-2 text-center">Nenhum evento registrado ainda.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Compatível com Room 2.6+, Supabase Kotlin SDK e Firebase Firestore</span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/30 transition"
          >
            Concluir Visualização
          </button>
        </div>
      </motion.div>
    </div>
  );
};
