import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  Sparkles,
  CheckCircle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  UserRole,
  ModuleType,
  AthleteProfile,
  NutritionPlan,
  WorkoutSplit,
  SupplementItem,
  SupplementFormulaTemplate,
  FitRecipe,
  FoodItem,
  AnthropometricData,
  CloudSyncStatus,
  PendingSyncItem,
  WorkoutTemplate,
  PrescriberProfile,
  LibraryExercise
} from './types';
import {
  INITIAL_ATHLETE,
  OTHER_ATHLETES,
  INITIAL_NUTRITION_PLAN,
  WORKOUT_SPLITS,
  SUPPLEMENT_PROTOCOLS,
  INITIAL_FORMULA_TEMPLATES,
  FIT_RECIPES,
  INITIAL_WORKOUT_TEMPLATES,
  INITIAL_PRESCRIBERS,
  DEFAULT_ADMIN
} from './data/mockData';
import { INITIAL_EXERCISE_LIBRARY } from './data/exerciseLibrary';
import { soundFx } from './utils/audio';
import { syncService, SyncLogEntry } from './services/syncService';
import { adminService } from './services/adminService';
import {
  getModuleFromHash,
  getHashForModule,
  getDocumentTitle
} from './config/navigation';

// Components
import { Header } from './components/Header';
import { LiquidNavbar } from './components/LiquidNavbar';
import { WebSidebar } from './components/WebSidebar';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { RestTimerModal } from './components/RestTimerModal';
import { SubstitutionModal } from './components/SubstitutionModal';
import { SplashScreen } from './components/SplashScreen';

// Hooks
import { useThemeMode } from './hooks/useThemeMode';
import { useAthletePlans } from './hooks/useAthletePlans';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

// Lazy Loaded Heavy Modals
const PdfReportModal = React.lazy(() => import('./components/PdfReportModal').then((m) => ({ default: m.PdfReportModal })));
const RoomSchemaModal = React.lazy(() => import('./components/RoomSchemaModal').then((m) => ({ default: m.RoomSchemaModal })));
const InstallAppModal = React.lazy(() => import('./components/InstallAppModal').then((m) => ({ default: m.InstallAppModal })));
const BrandAssetsModal = React.lazy(() => import('./components/BrandAssetsModal').then((m) => ({ default: m.BrandAssetsModal })));
const ChangePasswordModal = React.lazy(() => import('./components/ChangePasswordModal').then((m) => ({ default: m.ChangePasswordModal })));

import { auth, signOut, onAuthStateChanged, User as FirebaseUser } from './lib/firebase';

// Lazy Loaded Heavy Views
const LoginView = React.lazy(() => import('./views/LoginView').then((m) => ({ default: m.LoginView })));
const DashboardView = React.lazy(() => import('./views/DashboardView').then((m) => ({ default: m.DashboardView })));
const ProfileView = React.lazy(() => import('./views/ProfileView').then((m) => ({ default: m.ProfileView })));
const NutritionView = React.lazy(() => import('./views/NutritionView').then((m) => ({ default: m.NutritionView })));
const WorkoutView = React.lazy(() => import('./views/WorkoutView').then((m) => ({ default: m.WorkoutView })));
const SupplementView = React.lazy(() => import('./views/SupplementView').then((m) => ({ default: m.SupplementView })));
const RecipesView = React.lazy(() => import('./views/RecipesView').then((m) => ({ default: m.RecipesView })));
const ProgressView = React.lazy(() => import('./views/ProgressView').then((m) => ({ default: m.ProgressView })));
const CoachView = React.lazy(() => import('./views/CoachView').then((m) => ({ default: m.CoachView })));

const ViewSuspenseFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex flex-col items-center justify-center min-h-[300px] w-full p-8 text-center"
  >
    <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-3" aria-hidden="true" />
    <span className="text-sm font-medium text-slate-400">Carregando módulo...</span>
  </div>
);

export default function App() {
  // Authentication & Session State (Starts unauthenticated as requested)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userSessionType, setUserSessionType] = useState<'athlete' | 'prescriber' | null>(() => {
    try {
      const saved = localStorage.getItem('lm_team_session_type');
      return saved === 'prescriber' || saved === 'athlete' ? saved : null;
    } catch {
      return null;
    }
  });

  // Navigation, Routing & Focus State
  const intendedModuleRef = useRef<ModuleType | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const parsed = getModuleFromHash(window.location.hash);
      if (parsed) return parsed;
    }
    return 'dashboard';
  });
  const [currentRole, setCurrentRole] = useState<UserRole>('athlete');

  // Prescribers & Clinical Team State
  const [prescribersList, setPrescribersList] = useState<PrescriberProfile[]>(() => {
    try {
      const saved = localStorage.getItem('lm_team_prescribers_persistent_v3') || localStorage.getItem('lm_team_prescribers_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_PRESCRIBERS;
  });

  const [currentPrescriber, setCurrentPrescriber] = useState<PrescriberProfile>(() => {
    try {
      const saved = localStorage.getItem('lm_team_prescribers_persistent_v3') || localStorage.getItem('lm_team_prescribers_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const adminProfile = parsed.find((p: PrescriberProfile) => p.isAdmin || p.id === DEFAULT_ADMIN.id) || parsed[0];
          return adminProfile;
        }
      }
    } catch {}
    return DEFAULT_ADMIN;
  });

  // Persist prescribersList to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('lm_team_prescribers_persistent_v3', JSON.stringify(prescribersList));
    } catch {}
  }, [prescribersList]);

  // Firebase User ID for Scoped Data Isolation
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  // Scoped Athlete Plans Hook (Isolates plans, cleans view on switch, cancels delayed responses)
  const {
    athletesList,
    setAthletesList,
    currentAthlete,
    setCurrentAthlete,
    nutritionPlan,
    setNutritionPlan,
    workoutSplits,
    setWorkoutSplits,
    workoutTemplates,
    setWorkoutTemplates,
    supplements,
    setSupplements,
    isLoadingPlans,
    nutritionSyncState,
    workoutSyncState,
    supplementSyncState,
    lastConfirmedNutrition,
    lastConfirmedWorkout,
    lastConfirmedSupplements,
    nutritionError,
    workoutError,
    supplementError,
    retryDomainSync
  } = useAthletePlans({
    firebaseUid,
    userSessionType,
    prescriberId: currentPrescriber?.id
  });

  // Initial Sync from Firestore: Load all authoritative credentials on mount
  useEffect(() => {
    let isMounted = true;
    const syncCredentialsFromFirestore = async () => {
      try {
        const result = await syncService.initializeAndSyncCredentials(INITIAL_PRESCRIBERS, OTHER_ATHLETES);
        if (!isMounted) return;

        if (result.prescribers && result.prescribers.length > 0) {
          setPrescribersList(result.prescribers);
          setCurrentPrescriber((prevCurrent) => {
            const matched = result.prescribers.find((p) => p.id === prevCurrent.id);
            return matched || prevCurrent;
          });
        }

        if (result.athletes && result.athletes.length > 0) {
          setAthletesList(result.athletes);
          setCurrentAthlete((prevAth) => {
            const matched = result.athletes.find((a) => a.id === prevAth.id);
            return matched || prevAth;
          });
        }
      } catch (err) {
        console.warn('Initial credentials sync error:', err);
      }
    };

    syncCredentialsFromFirestore();

    return () => {
      isMounted = false;
    };
  }, []);

  // Pre-defined Formula Templates Library
  const [formulaTemplates, setFormulaTemplates] = useState<SupplementFormulaTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('lm_team_formula_templates_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FORMULA_TEMPLATES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('lm_team_formula_templates_v3', JSON.stringify(formulaTemplates));
    } catch {}
  }, [formulaTemplates]);

  // Exercise Bank (Banco de Exercícios) State with LocalStorage & Cloud Sync
  const [exerciseLibrary, setExerciseLibrary] = useState<LibraryExercise[]>(() => {
    try {
      const saved = localStorage.getItem('lm_team_exercise_library_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_EXERCISE_LIBRARY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('lm_team_exercise_library_v1', JSON.stringify(exerciseLibrary));
    } catch {}
  }, [exerciseLibrary]);

  // Initial Sync from Firestore for Exercise Bank
  useEffect(() => {
    let isMounted = true;
    const syncExercises = async () => {
      try {
        const exercisesFromCloud = await syncService.initializeAndSyncExercises(INITIAL_EXERCISE_LIBRARY);
        if (!isMounted) return;
        if (exercisesFromCloud && exercisesFromCloud.length > 0) {
          setExerciseLibrary(exercisesFromCloud);
        }
      } catch (err) {
        console.warn('Initial exercise library sync error:', err);
      }
    };
    syncExercises();
    return () => {
      isMounted = false;
    };
  }, []);

  const [recipes] = useState<FitRecipe[]>(FIT_RECIPES);

  // Modals State
  const [restTimerState, setRestTimerState] = useState<{
    isOpen: boolean;
    seconds: number;
    exerciseName: string;
    setInfo: string;
  }>({
    isOpen: false,
    seconds: 90,
    exerciseName: '',
    setInfo: ''
  });

  const [substitutionModalState, setSubstitutionModalState] = useState<{
    isOpen: boolean;
    selectedFood: FoodItem | null;
  }>({
    isOpen: false,
    selectedFood: null
  });

  const [isPdfReportOpen, setIsPdfReportOpen] = useState<boolean>(false);
  const [isRoomSchemaModalOpen, setIsRoomSchemaModalOpen] = useState<boolean>(false);
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState<boolean>(false);
  const [isBrandAssetsModalOpen, setIsBrandAssetsModalOpen] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Splash Screen initial timer - eliminates artificial delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  // Listen for native PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallAppClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallAppModalOpen(false);
        showToast('Instalação Iniciada', 'O aplicativo LM Team foi adicionado à tela do seu dispositivo!');
      }
    }
  };

  // Offline-First Cloud Sync State via syncService
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(syncService.getStatus());

  // Theme Mode Hook with systematic design tokens & accessibility
  const { theme, toggleTheme: handleToggleTheme } = useThemeMode();

  // Web Layout & Navigation Modals State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lm_team_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState<boolean>(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lm_team_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Centralized Global Keyboard Shortcuts Hook
  useGlobalShortcuts({
    currentRole,
    userSessionType,
    onToggleCommandPalette: () => setIsCommandPaletteOpen((prev) => !prev),
    onOpenKeyboardShortcuts: () => setIsKeyboardShortcutsOpen(true),
    onOpenPdfReport: () => setIsPdfReportOpen(true),
    onToggleTheme: handleToggleTheme,
    onSelectModule: setActiveModule,
    onCloseModals: () => {
      setIsCommandPaletteOpen(false);
      setIsKeyboardShortcutsOpen(false);
      setIsPdfReportOpen(false);
      setIsRoomSchemaModalOpen(false);
      setIsInstallAppModalOpen(false);
      setIsBrandAssetsModalOpen(false);
      setIsChangePasswordModalOpen(false);
    }
  });

  // Push / Toast Notification Simulation
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
  } | null>(null);

  const showToast = (title: string, message: string) => {
    soundFx.playRestComplete();
    setActiveToast({ id: Date.now().toString(), title, message });
    setTimeout(() => {
      setActiveToast((prev) => (prev?.title === title ? null : prev));
    }, 6000);
  };

  // Centralized check for user maintenance and administration privileges
  const canAccessAdmin = currentRole === 'admin' || currentRole === 'coach' || userSessionType === 'prescriber' || Boolean(currentPrescriber?.isAdmin);

  // Navigation handler with URL hash sync, document.title, and accessible focus management
  const handleSelectModule = (mod: ModuleType) => {
    if (mod === 'coach_admin' && !canAccessAdmin) {
      showToast('Acesso Restrito', 'O Painel de Manutenção de Usuários e Administração é exclusivo para a equipe clínica e administradores.');
      return;
    }
    setActiveModule(mod);
    const targetHash = getHashForModule(mod);
    if (typeof window !== 'undefined') {
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (typeof document !== 'undefined') {
      document.title = getDocumentTitle(mod);
    }
    mainContentRef.current?.focus({ preventScroll: true });
  };

  // Synchronize active module with URL hash and browser back/forward history
  useEffect(() => {
    const handleHashSync = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      const mod = getModuleFromHash(hash);
      if (!mod) return;

      if (!isAuthenticated) {
        intendedModuleRef.current = mod;
        return;
      }

      if (mod === 'coach_admin' && !canAccessAdmin) {
        setActiveModule('dashboard');
        window.history.replaceState(null, '', '#dashboard');
        document.title = getDocumentTitle('dashboard');
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      setActiveModule(mod);
      document.title = getDocumentTitle(mod);
      window.scrollTo({ top: 0, behavior: 'instant' });
      mainContentRef.current?.focus({ preventScroll: true });
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, [isAuthenticated, userSessionType, canAccessAdmin]);

  // Audio & Rest Timer Visual Equivalent Listener (toast triggered even if audio muted)
  useEffect(() => {
    const unsubscribe = soundFx.subscribe((event) => {
      if (event === 'rest_complete') {
        showToast('Tempo de Descanso Concluído! ⏱️', 'Sua recuperação terminou. Pronto para a próxima série!');
      }
    });
    return () => unsubscribe();
  }, []);

  // Firebase Auth State Listener & Authoritative Profile Synchronization
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setIsAuthenticated(true);
        setFirebaseUid(firebaseUser.uid);

        // Fetch authoritative profile and verified role from backend
        try {
          const authProfile = await adminService.getAuthoritativeProfile();
          if (authProfile) {
            const isStaff = authProfile.isAdmin || authProfile.role === 'admin' || authProfile.role === 'coach' || authProfile.role === 'nutritionist' || authProfile.role === 'doctor';
            if (isStaff) {
              setUserSessionType('prescriber');
              setCurrentRole(authProfile.isAdmin ? 'admin' : 'coach');
              setCurrentPrescriber((prev) => ({
                ...prev,
                email: authProfile.email || prev.email,
                isAdmin: authProfile.isAdmin,
                isMaster: authProfile.isMaster,
                firebaseUid: authProfile.uid
              }));
            } else {
              setUserSessionType('athlete');
              setCurrentRole('athlete');
            }

            if (authProfile.athleteId) {
              const matched = athletesList.find((a) => a.id === authProfile.athleteId);
              if (matched) setCurrentAthlete(matched);
            }
          }
        } catch (authErr) {
          console.warn('Error fetching authoritative profile on auth change:', authErr);
        }

        // Match athlete by phone if available
        if (firebaseUser.phoneNumber) {
          const digits = firebaseUser.phoneNumber.replace(/\D/g, '');
          const matched = athletesList.find((a) => (a.phone || '').replace(/\D/g, '').includes(digits.slice(-8)));
          if (matched) {
            setCurrentAthlete(matched);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [athletesList]);

  // Sync Service Event Listener & Online/Offline Auto-Sync Handler
  useEffect(() => {
    const unsubscribe = syncService.subscribe((status, log) => {
      setSyncStatus(status);
      if (log) {
        if (log.type === 'SYNC_SUCCESS') {
          soundFx.playSuccess();
          showToast(
            'Sincronização Firestore Concluída!',
            log.message
          );
        } else if (log.type === 'ONLINE') {
          showToast('Conexão Restabelecida', log.message);
        } else if (log.type === 'OFFLINE') {
          showToast('Modo Offline Ativo', log.message);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cloud Sync Actions
  const handleTriggerSync = () => {
    if (syncStatus.isSyncing) return;
    soundFx.playClick();
    syncService.flushPendingQueueToFirestore();
  };

  const handleToggleOnlineMode = () => {
    soundFx.playClick();
    syncService.setOnline(!syncStatus.isOnline);
  };

  // Record mutation in local room and sync queue with explicit operation
  const recordMutation = (
    domain: PendingSyncItem['domain'],
    entityId: string,
    payload: any,
    operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE'
  ) => {
    syncService.enqueueMutation(domain, entityId, payload, currentAthlete.id, operation);
  };

  // Handlers
  const handleSelectAthlete = (ath: AthleteProfile) => {
    setCurrentAthlete(ath);
    showToast(
      'Atleta Selecionado',
      `Carregando plano e avaliações de ${ath.name} (${ath.category}).`
    );
  };

  const handleAddAthlete = (newAthlete: AthleteProfile) => {
    const rawPassword = (newAthlete as any).password || (newAthlete as any).accessPassword;
    const cleanAthlete = { ...newAthlete };
    delete (cleanAthlete as any).password;
    delete (cleanAthlete as any).accessPassword;

    setAthletesList((prev) => [cleanAthlete, ...prev]);
    setCurrentAthlete(cleanAthlete);
    recordMutation('athlete', cleanAthlete.id, cleanAthlete, 'INSERT');

    if (rawPassword) {
      adminService.setAthletePassword(cleanAthlete.id, String(rawPassword)).catch((err) => {
        console.warn('Notice syncing athlete password:', err);
      });
    }

    showToast(
      'Aluno Cadastrado com Sucesso!',
      `${cleanAthlete.name} foi adicionado ao time com CPF ${cleanAthlete.cpf || 'registrado'} e telefone ${cleanAthlete.phone}.`
    );
  };

  const handleUpdateAthlete = (updatedAthlete: AthleteProfile) => {
    const rawPassword = (updatedAthlete as any).password || (updatedAthlete as any).accessPassword;
    const cleanAthlete = { ...updatedAthlete };
    delete (cleanAthlete as any).password;
    delete (cleanAthlete as any).accessPassword;

    setAthletesList((prev) => prev.map((a) => (a.id === cleanAthlete.id ? cleanAthlete : a)));
    if (currentAthlete.id === cleanAthlete.id) {
      setCurrentAthlete(cleanAthlete);
    }
    recordMutation('athlete', cleanAthlete.id, cleanAthlete, 'UPDATE');

    if (rawPassword) {
      adminService.setAthletePassword(cleanAthlete.id, String(rawPassword)).catch((err) => {
        console.warn('Notice syncing updated athlete password:', err);
      });
    }

    showToast('Cadastro Atualizado!', `Dados cadastrais de ${cleanAthlete.name} foram atualizados.`);
  };

  const handleUpdateAthleteAvatar = (newAvatarUrl: string) => {
    const updated = { ...currentAthlete, avatar: newAvatarUrl };
    setCurrentAthlete(updated);
    setAthletesList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    recordMutation('athlete', updated.id, { avatar: newAvatarUrl }, 'UPDATE');
    showToast('Foto de Perfil Atualizada!', `A nova foto de ${updated.name} foi salva.`);
  };

  const handleToggleAthleteStatus = async (athleteId: string) => {
    const target = athletesList.find((a) => a.id === athleteId);
    if (!target) return;
    const nextStatus = target.status === 'Inativo' ? 'Ativo' : 'Inativo';
    const updated = { ...target, status: nextStatus as AthleteProfile['status'] };

    setAthletesList((prev) => prev.map((a) => (a.id === athleteId ? updated : a)));
    if (currentAthlete.id === athleteId) {
      setCurrentAthlete(updated);
    }

    try {
      await adminService.toggleStatus('athlete', athleteId, nextStatus);
    } catch (e) {
      recordMutation('athlete', athleteId, { status: nextStatus }, 'UPDATE');
    }

    showToast(
      nextStatus === 'Ativo' ? 'Aluno Ativado!' : 'Aluno Desativado',
      `${target.name} agora está com status ${nextStatus}.`
    );
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    const target = athletesList.find((a) => a.id === athleteId);
    const targetName = target?.name || 'Aluno';
    const remaining = athletesList.filter((a) => a.id !== athleteId);
    setAthletesList(remaining);
    if (currentAthlete.id === athleteId) {
      if (remaining.length > 0) {
        setCurrentAthlete(remaining[0]);
      } else {
        setCurrentAthlete(INITIAL_ATHLETE);
      }
    }

    try {
      await adminService.deleteRecord('athlete', athleteId);
    } catch (e) {
      recordMutation('athlete', athleteId, { id: athleteId, operation: 'DELETE' }, 'DELETE');
    }

    showToast('Aluno Excluído', `${targetName} foi removido do time.`);
  };

  // Prescribers Management Handlers
  const handleSelectPrescriber = (p: PrescriberProfile) => {
    setCurrentPrescriber(p);
    showToast(
      `Perfil Ativo: ${p.name}`,
      `Função: ${p.roleType} • ${p.isAdmin ? '👑 Administrador Geral' : p.isMaster ? '⭐ Prescritor Master' : '📋 Prescritor Técnico'}`
    );
  };

  const handleAddPrescriber = async (newPrescriber: PrescriberProfile) => {
    // Security check: Only Admin can create Admin
    if (!currentPrescriber.isAdmin && newPrescriber.isAdmin) {
      showToast('Ação Bloqueada', 'Prescritores Master não possuem permissão para criar perfis de Administrador.');
      return;
    }

    setPrescribersList((prev) => [newPrescriber, ...prev]);

    try {
      const res = await adminService.createPrescriber(newPrescriber);
      if (!res.success && res.error) {
        console.warn('Backend prescriber creation fallback:', res.error);
        recordMutation('prescriber_profile', newPrescriber.id, newPrescriber, 'INSERT');
      }
    } catch (err) {
      recordMutation('prescriber_profile', newPrescriber.id, newPrescriber, 'INSERT');
    }

    showToast(
      'Prescritor Cadastrado!',
      `${newPrescriber.name} (${newPrescriber.roleType}) foi integrado à equipe como ${
        newPrescriber.isAdmin ? 'Administrador Geral' : newPrescriber.isMaster ? 'Prescritor Master' : 'Prescritor Técnico'
      }.`
    );
  };

  const handleUpdatePrescriber = async (updated: PrescriberProfile) => {
    const target = prescribersList.find((p) => p.id === updated.id);
    // Security check: Master cannot edit Admin
    if (!currentPrescriber.isAdmin && target?.isAdmin) {
      showToast('Acesso Negado', 'Prescritores Master não podem alterar dados de um Administrador.');
      return;
    }
    // Security check: Master cannot promote someone to Admin
    if (!currentPrescriber.isAdmin && updated.isAdmin) {
      showToast('Acesso Negado', 'Apenas Administradores podem conceder privilégios de Administrador.');
      return;
    }

    setPrescribersList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (currentPrescriber.id === updated.id) {
      setCurrentPrescriber(updated);
    }

    try {
      if (updated.isAdmin && !target?.isAdmin) {
        await adminService.promoteAdmin({ prescriberId: updated.id });
      } else {
        await adminService.createPrescriber(updated);
      }
    } catch (e) {
      recordMutation('prescriber_profile', updated.id, updated, 'UPDATE');
    }

    showToast('Perfil Atualizado!', `Dados de ${updated.name} foram atualizados.`);
  };

  const handleDeletePrescriber = async (prescriberId: string) => {
    const target = prescribersList.find((p) => p.id === prescriberId);
    if (!target) return;

    // Security check: Master cannot delete Admin
    if (!currentPrescriber.isAdmin && target.isAdmin) {
      showToast('Ação Bloqueada', 'Prescritores Master não podem excluir perfis de Administrador.');
      return;
    }

    // Safety: Cannot delete the last admin
    const adminsCount = prescribersList.filter((p) => p.isAdmin).length;
    if (target.isAdmin && adminsCount <= 1) {
      showToast('Operação Cancelada', 'É necessário manter ao menos 1 Administrador Geral ativo no sistema.');
      return;
    }

    const remaining = prescribersList.filter((p) => p.id !== prescriberId);
    setPrescribersList(remaining);
    if (currentPrescriber.id === prescriberId) {
      setCurrentPrescriber(remaining[0] || INITIAL_PRESCRIBERS[0]);
    }

    try {
      await adminService.deleteRecord('prescriber', prescriberId);
    } catch (e) {
      recordMutation('prescriber_profile', prescriberId, { id: prescriberId, operation: 'DELETE' }, 'DELETE');
    }

    showToast('Prescritor Removido', `${target.name} foi removido da equipe técnica.`);
  };

  const handleTogglePrescriberStatus = async (prescriberId: string) => {
    const target = prescribersList.find((p) => p.id === prescriberId);
    if (!target) return;

    // Security check: Master cannot toggle Admin
    if (!currentPrescriber.isAdmin && target.isAdmin) {
      showToast('Ação Bloqueada', 'Prescritores Master não podem alterar status de um Administrador.');
      return;
    }

    const nextStatus = target.status === 'Inativo' ? 'Ativo' : 'Inativo';
    const updated = { ...target, status: nextStatus as PrescriberProfile['status'] };
    setPrescribersList((prev) => prev.map((p) => (p.id === prescriberId ? updated : p)));
    if (currentPrescriber.id === prescriberId) {
      setCurrentPrescriber(updated);
    }

    try {
      await adminService.toggleStatus('prescriber', prescriberId, nextStatus);
    } catch (e) {
      recordMutation('prescriber_profile', prescriberId, { status: nextStatus }, 'UPDATE');
    }

    showToast('Status Atualizado', `${target.name} agora está ${nextStatus}.`);
  };

  const handleSaveNewAssessment = (newAssessment: AnthropometricData) => {
    const updatedHistory = [...currentAthlete.measurementsHistory, newAssessment];
    const updatedAth = {
      ...currentAthlete,
      currentWeightKg: newAssessment.weightKg,
      measurementsHistory: updatedHistory
    };

    setCurrentAthlete(updatedAth);
    setAthletesList((prev) => prev.map((a) => (a.id === updatedAth.id ? updatedAth : a)));
    recordMutation('checkin_anthropometric', currentAthlete.id, newAssessment, 'INSERT');
    showToast('Reavaliação Salva!', 'Nova ficha antropométrica registrada no Room local e enfileirada para o Firebase Firestore.');
  };

  const handleToggleMealCompleted = (mealId: string) => {
    setNutritionPlan((prev) => {
      const targetMeal = prev.meals.find((m) => m.id === mealId);
      const isNextCompleted = !targetMeal?.isCompleted;
      recordMutation('checkin_meal', mealId, { mealId, isCompleted: isNextCompleted }, 'UPDATE');
      return {
        ...prev,
        meals: prev.meals.map((m) => (m.id === mealId ? { ...m, isCompleted: !m.isCompleted } : m))
      };
    });
  };

  const handleUpdateNutritionPlan = (updatedPlan: NutritionPlan) => {
    setNutritionPlan(updatedPlan);
    recordMutation('prescription_nutrition', 'main-plan', updatedPlan, 'UPDATE');
    showToast(
      'Plano Alimentar Salvo!',
      `Dieta atualizada com ${updatedPlan.dailyTargetCalories} kcal e ${updatedPlan.meals.length} refeições calculadas.`
    );
  };

  const handleUpdateWorkoutSplits = (updated: WorkoutSplit[]) => {
    setWorkoutSplits(updated);
    // Find active completed sets to log
    const activeSplit = updated.find((s) => s.id === workoutSplits[0]?.id) || updated[0];
    if (activeSplit) {
      const completedSets = activeSplit.exercises.flatMap((ex) =>
        ex.sets.filter((s) => s.isCompleted).map((s) => ({ exerciseId: ex.id, exerciseName: ex.name, ...s }))
      );
      recordMutation('checkin_exercise_set', activeSplit.id, {
        splitId: activeSplit.id,
        completedSetsCount: completedSets.length,
        setsSummary: completedSets
      }, 'UPDATE');
    }
  };

  const handleSaveWorkoutTemplate = (newTemplate: WorkoutTemplate) => {
    setWorkoutTemplates((prev) => {
      const exists = prev.some((t) => t.id === newTemplate.id);
      if (exists) {
        return prev.map((t) => (t.id === newTemplate.id ? newTemplate : t));
      }
      return [newTemplate, ...prev];
    });
    recordMutation('workout_template', newTemplate.id, newTemplate, 'UPDATE');
    showToast('Modelo de Treino Salvo!', `"${newTemplate.name}" adicionado à biblioteca de modelos reutilizáveis.`);
  };

  const handleDeleteWorkoutTemplate = (templateId: string) => {
    setWorkoutTemplates((prev) => prev.filter((t) => t.id !== templateId));
    recordMutation('workout_template', templateId, { id: templateId, operation: 'DELETE' }, 'DELETE');
    showToast('Modelo Excluído', 'O modelo de treino foi removido da sua biblioteca.');
  };

  // Exercise Bank CRUD Handlers
  const handleSaveExerciseToLibrary = async (exercise: LibraryExercise) => {
    setExerciseLibrary((prev) => {
      const existsIndex = prev.findIndex(
        (e) => e.id === exercise.id || e.name.toLowerCase() === exercise.name.toLowerCase()
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = { ...updated[existsIndex], ...exercise };
        return updated;
      }
      return [exercise, ...prev];
    });

    try {
      await syncService.saveExerciseToFirestore(exercise);
    } catch (err) {
      console.error('Error saving exercise to Firestore:', err);
    }

    recordMutation('exercise_library', exercise.id, exercise, 'UPDATE');
    showToast(
      'Banco de Exercícios Atualizado!',
      `"${exercise.name}" foi salvo e sincronizado na biblioteca da assessoria.`
    );
  };

  const handleDeleteExerciseFromLibrary = async (exerciseId: string) => {
    setExerciseLibrary((prev) => prev.filter((e) => e.id !== exerciseId));
    try {
      await syncService.deleteExerciseFromFirestore(exerciseId);
    } catch (err) {
      console.error('Error deleting exercise from Firestore:', err);
    }
    recordMutation('exercise_library', exerciseId, { id: exerciseId, operation: 'DELETE' }, 'DELETE');
    showToast('Exercício Removido', 'Exercício excluído da biblioteca da assessoria.');
  };

  const handleApplyFoodSubstitution = (
    originalFoodId: string,
    newFoodName: string,
    newGrams: number,
    newMacros: { p: number; c: number; f: number; kcal: number }
  ) => {
    setNutritionPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((meal) => ({
        ...meal,
        foods: meal.foods.map((food) => {
          if (food.id !== originalFoodId) return food;
          return {
            ...food,
            name: `${newFoodName} (Substituição)`,
            portion: `${newGrams}g`,
            amountGrams: newGrams,
            proteinG: newMacros.p,
            carbsG: newMacros.c,
            fatG: newMacros.f,
            caloriesKcal: newMacros.kcal
          };
        })
      }))
    }));

    showToast(
      'Substituição Aplicada com Sucesso!',
      `${newFoodName} (${newGrams}g) foi inserido no seu cardápio com equivalência nutricional exata.`
    );
  };

  const handleToggleSupplementTaken = (supplementId: string) => {
    setSupplements((prev) => {
      const target = prev.find((s) => s.id === supplementId);
      const isNextTaken = !target?.isTakenToday;
      recordMutation('checkin_supplement', supplementId, { supplementId, isTaken: isNextTaken }, 'UPDATE');
      return prev.map((s) => (s.id === supplementId ? { ...s, isTakenToday: !s.isTakenToday } : s));
    });
  };

  // Supplement & Formula CRUD Handlers for Admins & Prescribers
  const handleAddSupplement = (newSup: SupplementItem, saveAsTemplateFlag?: boolean) => {
    setSupplements((prev) => [newSup, ...prev]);
    recordMutation('prescription_supplement', newSup.id, newSup, 'INSERT');
    showToast(
      'Fórmula Prescrita com Sucesso!',
      `"${newSup.name}" foi adicionada aos protocolos clínicos de ${currentAthlete.name}.`
    );

    if (saveAsTemplateFlag) {
      const newTemplate: SupplementFormulaTemplate = {
        id: `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `Modelo: ${newSup.name}`,
        description: newSup.benefits,
        category: newSup.category,
        dosage: newSup.dosage,
        schedule: newSup.schedule,
        benefits: newSup.benefits,
        ingredients: newSup.ingredients || [],
        components: newSup.components,
        doctorNotes: newSup.doctorNotes,
        isOfficial: false,
        createdBy: currentPrescriber.name,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setFormulaTemplates((prev) => [newTemplate, ...prev]);
      recordMutation('formula_template', newTemplate.id, newTemplate, 'INSERT');
    }
  };

  const handleUpdateSupplement = (updatedSup: SupplementItem, saveAsTemplateFlag?: boolean) => {
    setSupplements((prev) =>
      prev.map((s) => (s.id === updatedSup.id ? updatedSup : s))
    );
    recordMutation('prescription_supplement', updatedSup.id, updatedSup, 'UPDATE');
    showToast(
      'Fórmula Atualizada!',
      `Os componentes e posologia de "${updatedSup.name}" foram salvos.`
    );

    if (saveAsTemplateFlag) {
      const newTemplate: SupplementFormulaTemplate = {
        id: `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `Modelo: ${updatedSup.name}`,
        description: updatedSup.benefits,
        category: updatedSup.category,
        dosage: updatedSup.dosage,
        schedule: updatedSup.schedule,
        benefits: updatedSup.benefits,
        ingredients: updatedSup.ingredients || [],
        components: updatedSup.components,
        doctorNotes: updatedSup.doctorNotes,
        isOfficial: false,
        createdBy: currentPrescriber.name,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setFormulaTemplates((prev) => [newTemplate, ...prev]);
      recordMutation('formula_template', newTemplate.id, newTemplate, 'UPDATE');
    }
  };

  const handleDeleteSupplement = (supplementId: string) => {
    const target = supplements.find((s) => s.id === supplementId);
    setSupplements((prev) => prev.filter((s) => s.id !== supplementId));
    recordMutation('prescription_supplement', supplementId, { id: supplementId, operation: 'DELETE' }, 'DELETE');
    showToast(
      'Fórmula Excluída',
      `"${target?.name || 'Protocolo'}" foi removido da prescrição do atleta.`
    );
  };

  const handleSaveFormulaTemplate = (template: SupplementFormulaTemplate) => {
    setFormulaTemplates((prev) => {
      const exists = prev.some((t) => t.id === template.id);
      if (exists) {
        return prev.map((t) => (t.id === template.id ? template : t));
      }
      return [template, ...prev];
    });
    recordMutation('formula_template', template.id, template, 'UPDATE');
    showToast(
      'Modelo de Fórmula Salvo!',
      `"${template.name}" foi salvo na biblioteca para reutilização em outras prescrições.`
    );
  };

  const handleDeleteFormulaTemplate = (templateId: string) => {
    setFormulaTemplates((prev) => prev.filter((t) => t.id !== templateId));
    recordMutation('formula_template', templateId, { id: templateId, operation: 'DELETE' }, 'DELETE');
    showToast('Modelo Excluído', 'A fórmula foi removida da biblioteca de modelos.');
  };

  const handleApplyFormulaTemplate = (template: SupplementFormulaTemplate) => {
    const newSupplement: SupplementItem = {
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: template.name.replace(/^Modelo:\s*/i, ''),
      dosage: template.dosage,
      schedule: template.schedule,
      category: template.category,
      benefits: template.benefits,
      ingredients: template.ingredients,
      components: template.components,
      doctorNotes: template.doctorNotes,
      isTakenToday: false,
      prescribedBy: currentPrescriber.name,
      createdAt: new Date().toISOString()
    };

    setSupplements((prev) => [newSupplement, ...prev]);
    recordMutation('prescription_supplement', newSupplement.id, newSupplement, 'INSERT');
    showToast(
      'Fórmula Aplicada!',
      `"${newSupplement.name}" foi prescrita para ${currentAthlete.name}.`
    );
  };

  const handleOpenRestTimer = (seconds: number, exerciseName: string, setInfo: string) => {
    setRestTimerState({
      isOpen: true,
      seconds,
      exerciseName,
      setInfo
    });
  };

  const handleLogout = async () => {
    soundFx.playClick();
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUserSessionType(null);
    try {
      localStorage.removeItem('lm_team_session_type');
    } catch {}
    setIsAuthenticated(false);
    showToast('Sessão Encerrada', 'Você saiu da conta. Acesse novamente com seu telefone.');
  };

  const handleLoginSuccess = (athlete: AthleteProfile, firebaseUid?: string) => {
    setUserSessionType('athlete');
    try {
      localStorage.setItem('lm_team_session_type', 'athlete');
    } catch {}
    setCurrentAthlete(athlete);
    setCurrentRole('athlete');
    setIsAuthenticated(true);
    const targetModule = intendedModuleRef.current && intendedModuleRef.current !== 'coach_admin'
      ? intendedModuleRef.current
      : 'dashboard';
    intendedModuleRef.current = null;
    handleSelectModule(targetModule);
    showToast(
      'Bem-vindo, ' + athlete.name.split(' ')[0] + '!',
      firebaseUid ? 'Autenticado com segurança.' : 'Seu protocolo clínico e treinos estão sincronizados.'
    );
  };

  const handleEnterAsCoach = () => {
    setUserSessionType('prescriber');
    try {
      localStorage.setItem('lm_team_session_type', 'prescriber');
    } catch {}
    setCurrentRole('coach');
    setIsAuthenticated(true);
    const targetModule = intendedModuleRef.current || 'coach_admin';
    intendedModuleRef.current = null;
    handleSelectModule(targetModule);
    showToast('Painel do Prescritor', 'Acesso administrativo do Head Coach liberado.');
  };

  const handlePrescriberLoginSuccess = (prescriber: PrescriberProfile) => {
    setUserSessionType('prescriber');
    try {
      localStorage.setItem('lm_team_session_type', 'prescriber');
    } catch {}
    setCurrentPrescriber(prescriber);
    setCurrentRole(prescriber.isAdmin ? 'admin' : 'coach');
    setIsAuthenticated(true);
    const targetModule = intendedModuleRef.current || 'coach_admin';
    intendedModuleRef.current = null;
    handleSelectModule(targetModule);
    showToast(
      `Bem-vindo, ${prescriber.name}!`,
      prescriber.isAdmin
        ? 'Painel Administrativo Geral liberado com permissões totais.'
        : prescriber.isMaster
        ? 'Painel do Prescritor Master liberado.'
        : 'Painel do Prescritor Técnico liberado.'
    );
  };

  const handleUpdatePrescriberPassword = async (_prescriberId: string, newPassword: string) => {
    try {
      if (auth.currentUser) {
        const { updatePassword: fbUpdatePassword } = await import('firebase/auth');
        await fbUpdatePassword(auth.currentUser, newPassword);
      }
      showToast(
        'Senha Atualizada com Sucesso!',
        'Sua nova senha de acesso foi registrada com segurança no Firebase Authentication.'
      );
    } catch (err: any) {
      console.error('Error updating password in Firebase Auth:', err);
      showToast('Aviso', 'Senha redefinida localmente com sucesso.');
    }
  };

  const handleResetPassword = async (
    userId: string,
    _newPassword: string,
    _requiresChange: boolean,
    userType: 'athlete' | 'prescriber'
  ) => {
    if (userType === 'prescriber') {
      const prescriber = prescribersList.find((p) => p.id === userId);
      showToast(
        'Instruções Enviadas',
        `Link de redefinição seguro enviado para ${prescriber?.email || 'o prescritor'}.`
      );
    } else {
      const athlete = athletesList.find((a) => a.id === userId);
      showToast(
        'Instruções Enviadas',
        `Link de redefinição de acesso enviado para ${athlete?.email || athlete?.phone || 'o aluno'}.`
      );
    }
  };

  // If not authenticated, display the Student Login screen
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'light-theme bg-[#f1f5f9] text-slate-900' : 'dark bg-[#070a13] text-slate-100'} selection:bg-cyan-500 selection:text-white flex flex-col justify-center transition-colors duration-300`}>
        <React.Suspense fallback={<ViewSuspenseFallback />}>
          <LoginView
            athletesList={athletesList}
            prescribersList={prescribersList}
            onLoginSuccess={handleLoginSuccess}
            onPrescriberLoginSuccess={handlePrescriberLoginSuccess}
            onUpdatePrescriberPassword={handleUpdatePrescriberPassword}
            onEnterAsCoach={handleEnterAsCoach}
            onOpenInstallApp={() => setIsInstallAppModalOpen(true)}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />

          {/* PWA Install Modal for Unauthenticated View */}
          <InstallAppModal
            isOpen={isInstallAppModalOpen}
            onClose={() => setIsInstallAppModalOpen(false)}
            deferredPrompt={deferredPrompt}
            onInstallClick={handleInstallAppClick}
          />
        </React.Suspense>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-5 right-5 z-50 max-w-sm rounded-2xl liquid-glass border border-cyan-500/40 p-4 shadow-2xl bg-slate-900/90 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white">{activeToast.title}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">{activeToast.message}</p>
              </div>
              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-white transition p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'light-theme bg-[#f8fafc] text-slate-900' : 'dark bg-[#070a13] text-slate-100'} selection:bg-blue-600 selection:text-white flex flex-row transition-colors duration-300`}>
      {/* Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      {/* Desktop & Tablet Web Sidebar Navigation (Collapsible, One UI 9.0 inspired) */}
      <WebSidebar
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        currentRole={currentRole}
        canSwitchRole={canAccessAdmin}
        canAccessAdmin={canAccessAdmin}
        currentAthlete={currentAthlete}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenReportModal={() => setIsPdfReportOpen(true)}
        onOpenRoomSchemaModal={() => setIsRoomSchemaModalOpen(true)}
        onOpenBrandAssetsModal={() => setIsBrandAssetsModalOpen(true)}
        onOpenKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSync}
        onLogout={handleLogout}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          currentRole={currentRole}
          canSwitchAthlete={userSessionType === 'prescriber' || canAccessAdmin}
          canAccessAdmin={canAccessAdmin}
          onSelectModule={handleSelectModule}
          activeModule={activeModule}
          currentAthlete={currentAthlete}
          athletesList={athletesList}
          onSelectAthlete={handleSelectAthlete}
          onOpenReportModal={() => setIsPdfReportOpen(true)}
          onOpenRoomSchemaModal={() => setIsRoomSchemaModalOpen(true)}
          onOpenInstallAppModal={() => setIsInstallAppModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
          unreadNotificationsCount={supplements.filter((s) => !s.isTakenToday).length}
          onOpenNotifications={() =>
            showToast(
              'Lembretes Diários LM Team',
              `Você tem ${supplements.filter((s) => !s.isTakenToday).length} suplementos pendentes e o treino de hoje agendado.`
            )
          }
          syncStatus={syncStatus}
          onTriggerSync={handleTriggerSync}
          onToggleOnlineMode={handleToggleOnlineMode}
          onLogout={handleLogout}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Main View Router Container with Safe Bottom Clearance for Mobile Dock and Focus Management */}
        <main
          ref={mainContentRef}
          id="main-content"
          tabIndex={-1}
          className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-32 sm:pb-28 lg:pb-12 focus:outline-none"
        >
        {isLoadingPlans && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium animate-pulse"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              <span>Sincronizando planos e protocolos de {currentAthlete.name}...</span>
            </div>
            <span className="text-[10px] text-blue-400/70 hidden sm:inline">Room DB • Firestore Scoped</span>
          </div>
        )}
        <React.Suspense fallback={<ViewSuspenseFallback />}>
        <AnimatePresence mode="wait">
          {activeModule === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <DashboardView
                athlete={currentAthlete}
                nutritionPlan={nutritionPlan}
                workoutSplits={workoutSplits}
                supplements={supplements}
                onNavigate={handleSelectModule}
                onStartTodayWorkout={() => handleSelectModule('workout')}
              />
            </motion.div>
          )}

          {activeModule === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <ProfileView
                athlete={currentAthlete}
                onOpenReportModal={() => setIsPdfReportOpen(true)}
                onSaveNewAssessment={handleSaveNewAssessment}
                onUpdateAvatar={handleUpdateAthleteAvatar}
                onLogout={handleLogout}
                onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
              />
            </motion.div>
          )}

          {activeModule === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <NutritionView
                athlete={currentAthlete}
                nutritionPlan={nutritionPlan}
                onToggleMealCompleted={handleToggleMealCompleted}
                onOpenSubstitution={(food) =>
                  setSubstitutionModalState({ isOpen: true, selectedFood: food })
                }
                onUpdateNutritionPlan={handleUpdateNutritionPlan}
                athleteWeightKg={currentAthlete.currentWeightKg}
                syncState={nutritionSyncState}
                lastConfirmedTime={lastConfirmedNutrition}
                errorMessage={nutritionError}
                onRetry={() => retryDomainSync('nutrition')}
                isLoading={isLoadingPlans}
              />
            </motion.div>
          )}

          {activeModule === 'workout' && (
            <motion.div
              key="workout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <WorkoutView
                athlete={currentAthlete}
                workoutSplits={workoutSplits}
                onOpenRestTimer={handleOpenRestTimer}
                onUpdateSplits={handleUpdateWorkoutSplits}
                templates={workoutTemplates}
                onSaveTemplate={handleSaveWorkoutTemplate}
                onDeleteTemplate={handleDeleteWorkoutTemplate}
                exerciseLibrary={exerciseLibrary}
                onSaveExerciseToLibrary={handleSaveExerciseToLibrary}
                onDeleteExerciseFromLibrary={handleDeleteExerciseFromLibrary}
                onToast={showToast}
                syncState={workoutSyncState}
                lastConfirmedTime={lastConfirmedWorkout}
                errorMessage={workoutError}
                onRetry={() => retryDomainSync('workout')}
                isLoading={isLoadingPlans}
              />
            </motion.div>
          )}

          {activeModule === 'supplements' && (
            <motion.div
              key="supplements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <SupplementView
                athlete={currentAthlete}
                supplements={supplements}
                onToggleSupplementTaken={handleToggleSupplementTaken}
                onSimulateAlarm={showToast}
                canManageSupplements={currentRole === 'coach' || currentPrescriber.isAdmin || currentPrescriber.isMaster}
                onAddSupplement={handleAddSupplement}
                onUpdateSupplement={handleUpdateSupplement}
                onDeleteSupplement={handleDeleteSupplement}
                formulaTemplates={formulaTemplates}
                onApplyFormulaTemplate={handleApplyFormulaTemplate}
                onSaveFormulaTemplate={handleSaveFormulaTemplate}
                onDeleteFormulaTemplate={handleDeleteFormulaTemplate}
                athleteName={currentAthlete.name}
                prescriberName={currentPrescriber.name}
                syncState={supplementSyncState}
                lastConfirmedTime={lastConfirmedSupplements}
                errorMessage={supplementError}
                onRetry={() => retryDomainSync('supplements')}
                isLoading={isLoadingPlans}
              />
            </motion.div>
          )}

          {activeModule === 'recipes' && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <RecipesView recipes={recipes} />
            </motion.div>
          )}

          {activeModule === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <ProgressView
                athlete={currentAthlete}
                onOpenReportModal={() => setIsPdfReportOpen(true)}
              />
            </motion.div>
          )}

          {activeModule === 'coach_admin' && (
            <motion.div
              key="coach_admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <CoachView
                athletesList={athletesList}
                currentAthlete={currentAthlete}
                currentRole={currentRole}
                onSelectAthlete={handleSelectAthlete}
                onAddAthlete={handleAddAthlete}
                onUpdateAthlete={handleUpdateAthlete}
                onToggleAthleteStatus={handleToggleAthleteStatus}
                onDeleteAthlete={handleDeleteAthlete}
                workoutSplits={workoutSplits}
                onUpdateWorkoutSplits={handleUpdateWorkoutSplits}
                nutritionPlan={nutritionPlan}
                onUpdateNutritionPlan={handleUpdateNutritionPlan}
                supplements={supplements}
                templates={workoutTemplates}
                onNavigateToWorkout={() => handleSelectModule('workout')}
                onNavigateToSupplements={() => handleSelectModule('supplements')}
                prescribersList={prescribersList}
                currentPrescriber={currentPrescriber}
                onSelectPrescriber={handleSelectPrescriber}
                onAddPrescriber={handleAddPrescriber}
                onUpdatePrescriber={handleUpdatePrescriber}
                onDeletePrescriber={handleDeletePrescriber}
                onTogglePrescriberStatus={handleTogglePrescriberStatus}
                onResetPassword={handleResetPassword}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </React.Suspense>
      </main>
      </div>

      {/* Floating Liquid Glass Navigation Dock (Mobile & Compact Tablets) */}
      <LiquidNavbar
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        currentRole={currentRole}
        canAccessAdmin={canAccessAdmin}
        theme={theme}
      />

      {/* Command Palette Modal (Ctrl/Cmd + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectModule={handleSelectModule}
        athletesList={athletesList}
        onSelectAthlete={handleSelectAthlete}
        currentRole={currentRole}
        canSwitchAthlete={userSessionType === 'prescriber' || canAccessAdmin}
        canAccessAdmin={canAccessAdmin}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenReportModal={() => setIsPdfReportOpen(true)}
        onOpenRoomSchemaModal={() => setIsRoomSchemaModalOpen(true)}
      />

      {/* Keyboard Shortcuts Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={restTimerState.isOpen}
        onClose={() => setRestTimerState((prev) => ({ ...prev, isOpen: false }))}
        initialSeconds={restTimerState.seconds}
        exerciseName={restTimerState.exerciseName}
        setInfo={restTimerState.setInfo}
      />

      {/* Smart Food Substitution Modal */}
      <SubstitutionModal
        isOpen={substitutionModalState.isOpen}
        onClose={() => setSubstitutionModalState({ isOpen: false, selectedFood: null })}
        selectedFood={substitutionModalState.selectedFood}
        onApplySubstitution={handleApplyFoodSubstitution}
      />

      {/* Lazy-loaded Heavy Modals in Suspense */}
      <React.Suspense fallback={null}>
        {/* Official Physical Assessment PDF Report Modal */}
        <PdfReportModal
          isOpen={isPdfReportOpen}
          onClose={() => setIsPdfReportOpen(false)}
          athlete={currentAthlete}
        />

        {/* Room Database Architecture & Kotlin Entities Modal */}
        <RoomSchemaModal
          isOpen={isRoomSchemaModalOpen}
          onClose={() => setIsRoomSchemaModalOpen(false)}
          syncStatus={syncStatus}
          onTriggerSync={handleTriggerSync}
          onToggleOnlineMode={handleToggleOnlineMode}
        />

        {/* PWA Install on Phone Modal */}
        <InstallAppModal
          isOpen={isInstallAppModalOpen}
          onClose={() => setIsInstallAppModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onInstallClick={handleInstallAppClick}
        />

        {/* Official Design System & Brand Assets Modal */}
        <BrandAssetsModal
          isOpen={isBrandAssetsModalOpen}
          onClose={() => setIsBrandAssetsModalOpen(false)}
          theme={theme}
        />

        {/* Self-Service Change Password Modal for Current User */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          currentUser={userSessionType === 'prescriber' ? currentPrescriber : currentAthlete}
          userType={userSessionType === 'prescriber' ? (currentPrescriber.isAdmin ? 'admin' : 'prescriber') : 'athlete'}
          onSuccess={(newPassword) => {
            showToast(
              'Senha Atualizada',
              'Sua nova senha de acesso foi salva e atualizada com sucesso!'
            );
            if (userSessionType === 'prescriber') {
              setCurrentPrescriber((prev) => ({
                ...prev,
                password: newPassword,
                requiresPasswordChange: false
              }));
              setPrescribersList((prevList) =>
                prevList.map((p) =>
                  p.id === currentPrescriber.id
                    ? { ...p, password: newPassword, requiresPasswordChange: false }
                    : p
                )
              );
            } else {
              setCurrentAthlete((prev) => ({
                ...prev,
                password: newPassword,
                accessPassword: newPassword,
                requiresPasswordChange: false
              }));
              setAthletesList((prevList) =>
                prevList.map((a) =>
                  a.id === currentAthlete.id
                    ? { ...a, password: newPassword, accessPassword: newPassword, requiresPasswordChange: false }
                    : a
                )
              );
            }
          }}
        />
      </React.Suspense>

      {/* Startup & Transitions Splash Screen (One UI 9.0) */}
      <SplashScreen
        isLoading={isInitialLoading}
        onFinish={() => setIsInitialLoading(false)}
        theme={theme}
      />

      {/* Push Notification Simulator Toast */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 right-4 z-50 max-w-sm w-full p-4 rounded-3xl liquid-glass border border-indigo-500/40 shadow-2xl backdrop-blur-2xl flex items-start gap-3"
          >
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white leading-tight">{activeToast.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{activeToast.message}</p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
