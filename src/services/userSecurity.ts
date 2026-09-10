/**
 * ==============================================================================
 * CENTRALIZED USER AUTHORIZATION & ZERO-TRUST SECURITY MODULE
 * LM Team Assessoria Esportiva & Médica
 * ==============================================================================
 * 
 * Regras Estritas de Autorização e Governança:
 * 1. Lista explícita de campos permitidos para autocadastro.
 * 2. Proibição estrita de isAdmin, isMaster, athleteId, prescriberId e assignedAthleteIds
 *    fornecidos livremente pelo usuário.
 * 3. athleteId removido da lista de campos editáveis pelo próprio usuário.
 * 4. Fonte de autorização centralizada (banco de dados e claims seguras, sem concessão
 *    automática por e-mail).
 * 5. Vínculos e privilégios definidos exclusivamente por operações administrativas autorizadas.
 */

import { UserProfile } from '../types';

/**
 * Lista explícita de campos estritamente permitidos no autocadastro (/users/{uid})
 */
export const ALLOWED_SELF_REGISTRATION_FIELDS = [
  'id',
  'email',
  'name',
  'role',
  'status',
  'createdAt',
  'updatedAt',
  'phone',
  'avatar',
  'birthDate',
  'cpf',
  'bio',
  'gender'
] as const;

/**
 * Campos estritamente proibidos no autocadastro (devem ser definidos apenas por operação administrativa)
 */
export const FORBIDDEN_SELF_REGISTRATION_FIELDS = [
  'isAdmin',
  'isMaster',
  'athleteId',
  'prescriberId',
  'assignedAthleteIds'
] as const;

/**
 * Lista explícita de campos editáveis pelo próprio usuário (/users/{uid})
 * NOTA: 'athleteId' foi REMOVIDO para impedir adulteração de vínculo com outros atletas
 */
export const ALLOWED_SELF_UPDATE_FIELDS = [
  'name',
  'phone',
  'avatar',
  'birthDate',
  'cpf',
  'bio',
  'gender',
  'updatedAt',
  'passwordChangedAt',
  'requiresPasswordChange'
] as const;

/**
 * Campos estritamente proibidos para edição pelo próprio usuário
 */
export const FORBIDDEN_SELF_UPDATE_FIELDS = [
  'password',
  'accessPassword',
  'athleteId',
  'prescriberId',
  'assignedAthleteIds',
  'isAdmin',
  'isMaster',
  'role',
  'status',
  'id',
  'email'
] as const;

export interface ValidationResult<T = any> {
  isValid: boolean;
  error?: string;
  code?: 'PRIVILEGE_ESCALATION' | 'FORBIDDEN_LINK' | 'FORBIDDEN_FIELD' | 'INVALID_ROLE' | 'UNAUTHORIZED';
  sanitizedData?: T;
}

/**
 * Valida os dados de autocadastro para /users/{uid}.
 * Rejeita qualquer tentativa de elevação de privilégios ou vínculos arbitrários antes
 * de qualquer persistência ou acesso a dados.
 */
export function validateUserSelfRegistration(
  payload: Record<string, any>,
  callerUid: string
): ValidationResult<UserProfile> {
  if (!callerUid || !callerUid.trim()) {
    return {
      isValid: false,
      code: 'UNAUTHORIZED',
      error: 'Identificação de usuário (UID) ausente na sessão de autenticação.'
    };
  }

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      code: 'FORBIDDEN_FIELD',
      error: 'Corpo da requisição de cadastro inválido.'
    };
  }

  // 1. Proibição de isAdmin
  if ('isAdmin' in payload && payload.isAdmin !== false && payload.isAdmin !== undefined) {
    return {
      isValid: false,
      code: 'PRIVILEGE_ESCALATION',
      error: 'Tentativa de elevação de privilégios detectada: isAdmin não é permitido no autocadastro.'
    };
  }

  // 2. Proibição de isMaster
  if ('isMaster' in payload && payload.isMaster !== false && payload.isMaster !== undefined) {
    return {
      isValid: false,
      code: 'PRIVILEGE_ESCALATION',
      error: 'Tentativa de elevação de privilégios detectada: isMaster não é permitido no autocadastro.'
    };
  }

  // 3. Proibição de falsificação de prescriberId
  if ('prescriberId' in payload && payload.prescriberId) {
    return {
      isValid: false,
      code: 'FORBIDDEN_LINK',
      error: 'Falsificação de vínculo profissional: prescriberId só pode ser definido por um Administrador.'
    };
  }

  // 4. Proibição de vínculo arbitrário de athleteId
  if ('athleteId' in payload && payload.athleteId) {
    return {
      isValid: false,
      code: 'FORBIDDEN_LINK',
      error: 'Vínculo esportivo/clínico não autorizado: athleteId só pode ser definido por um Administrador.'
    };
  }

  // 5. Proibição de assignedAthleteIds
  if ('assignedAthleteIds' in payload && payload.assignedAthleteIds) {
    return {
      isValid: false,
      code: 'FORBIDDEN_LINK',
      error: 'Atribuição de alunos não autorizada: assignedAthleteIds só pode ser definido por um Administrador.'
    };
  }

  // 6. Role estrito (apenas 'athlete' é permitido no autocadastro)
  const requestedRole = payload.role || 'athlete';
  if (requestedRole !== 'athlete') {
    return {
      isValid: false,
      code: 'INVALID_ROLE',
      error: `Role '${requestedRole}' não permitido no autocadastro. Novos usuários devem se registrar exclusivamente como 'athlete'.`
    };
  }

  // 7. Validação da Lista Explícita de Campos Permitidos
  const allowedSet = new Set<string>(ALLOWED_SELF_REGISTRATION_FIELDS);
  const payloadKeys = Object.keys(payload);
  for (const key of payloadKeys) {
    if (!allowedSet.has(key)) {
      return {
        isValid: false,
        code: 'FORBIDDEN_FIELD',
        error: `Campo não permitido no autocadastro: '${key}'. Apenas campos cadastrais da lista explícita são aceitos.`
      };
    }
  }

  // 8. Sanitização e construção do documento seguro
  const sanitized: UserProfile = {
    id: callerUid,
    email: typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : '',
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : 'Novo Aluno',
    role: 'athlete',
    status: (payload.status === 'Ativo' || payload.status === 'Pendente') ? payload.status : 'Ativo',
    phone: typeof payload.phone === 'string' ? payload.phone : undefined,
    avatar: typeof payload.avatar === 'string' ? payload.avatar : undefined,
    birthDate: typeof payload.birthDate === 'string' ? payload.birthDate : undefined,
    cpf: typeof payload.cpf === 'string' ? payload.cpf : undefined,
    bio: typeof payload.bio === 'string' ? payload.bio : undefined,
    gender: typeof payload.gender === 'string' ? payload.gender : undefined,
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    isValid: true,
    sanitizedData: sanitized
  };
}

/**
 * Valida atualizações no documento /users/{uid}.
 * Garante que usuários não-administradores não consigam alterar athleteId, prescriberId,
 * isAdmin, isMaster, role ou assignedAthleteIds.
 */
export function validateUserProfileUpdate(
  updates: Record<string, any>,
  callerUid: string,
  targetUserId: string,
  options: {
    isCallerAdmin?: boolean;
    existingUserData?: Record<string, any>;
  } = {}
): ValidationResult<Record<string, any>> {
  const { isCallerAdmin = false, existingUserData = {} } = options;

  if (!callerUid || !callerUid.trim()) {
    return {
      isValid: false,
      code: 'UNAUTHORIZED',
      error: 'Usuário não autenticado.'
    };
  }

  // Se o autor da chamada não for admin, ele só pode atualizar seu próprio perfil
  if (!isCallerAdmin && callerUid !== targetUserId) {
    return {
      isValid: false,
      code: 'UNAUTHORIZED',
      error: 'Acesso negado: Você só pode atualizar seu próprio perfil.'
    };
  }

  // Se for Administrador, todas as alterações são autorizadas
  if (isCallerAdmin) {
    return {
      isValid: true,
      sanitizedData: { ...updates, updatedAt: new Date().toISOString() }
    };
  }

  // =========================================================================
  // VALIDAÇÃO ZERO-TRUST PARA O PRÓPRIO USUÁRIO (NÃO-ADMINISTRADOR)
  // =========================================================================

  // 1. athleteId é PROIBIDO na edição pelo próprio usuário
  if ('athleteId' in updates) {
    const existingAthleteId = existingUserData.athleteId;
    if (updates.athleteId !== existingAthleteId) {
      return {
        isValid: false,
        code: 'FORBIDDEN_LINK',
        error: 'Alteração não autorizada: athleteId não pode ser alterado pelo próprio usuário. Vínculos são gerenciados exclusivamente pela administração.'
      };
    }
  }

  // 2. prescriberId é PROIBIDO na edição
  if ('prescriberId' in updates && updates.prescriberId !== existingUserData.prescriberId) {
    return {
      isValid: false,
      code: 'FORBIDDEN_LINK',
      error: 'Alteração não autorizada: prescriberId não pode ser alterado pelo usuário.'
    };
  }

  // 3. assignedAthleteIds é PROIBIDO na edição
  if ('assignedAthleteIds' in updates) {
    return {
      isValid: false,
      code: 'FORBIDDEN_LINK',
      error: 'Alteração não autorizada: assignedAthleteIds só pode ser definido por um Administrador.'
    };
  }

  // 4. isAdmin e isMaster são PROIBIDOS na edição
  if ('isAdmin' in updates && updates.isAdmin !== existingUserData.isAdmin) {
    return {
      isValid: false,
      code: 'PRIVILEGE_ESCALATION',
      error: 'Tentativa de elevação de privilégios detectada: isAdmin não pode ser alterado pelo usuário.'
    };
  }
  if ('isMaster' in updates && updates.isMaster !== existingUserData.isMaster) {
    return {
      isValid: false,
      code: 'PRIVILEGE_ESCALATION',
      error: 'Tentativa de elevação de privilégios detectada: isMaster não pode ser alterado pelo usuário.'
    };
  }

  // 5. role é PROIBIDO na edição
  if ('role' in updates && updates.role !== existingUserData.role) {
    return {
      isValid: false,
      code: 'PRIVILEGE_ESCALATION',
      error: 'Alteração de perfil/papel não permitida: role não pode ser modificado pelo usuário.'
    };
  }

  // 6. Proíbe qualquer campo fora da lista explícita permitida para atualização
  const allowedSet = new Set<string>(ALLOWED_SELF_UPDATE_FIELDS);
  const updateKeys = Object.keys(updates);
  const sanitized: Record<string, any> = {};

  for (const key of updateKeys) {
    // Ignora se for a mesmíssima chave imutável mantida idêntica
    if (['id', 'email', 'role'].includes(key) && updates[key] === existingUserData[key]) {
      continue;
    }
    if (!allowedSet.has(key)) {
      return {
        isValid: false,
        code: 'FORBIDDEN_FIELD',
        error: `Campo '${key}' não é editável pelo próprio usuário.`
      };
    }
    sanitized[key] = updates[key];
  }

  sanitized.updatedAt = new Date().toISOString();

  return {
    isValid: true,
    sanitizedData: sanitized
  };
}

/**
 * Avaliação Centralizada de Autorização
 * 
 * Regra Mandatória: A autorização é baseada no registro oficial em /admins/{uid},
 * no documento oficial em /users/{uid} (role='admin' e isAdmin=true) ou em custom claims
 * atribuídas via Admin SDK.
 * 
 * JAMAIS concede privilégios de administrador baseado puramente no endereço de e-mail.
 */
export function evaluateAuthorization(params: {
  uid: string;
  email?: string;
  adminDocExists: boolean;
  userDoc?: Record<string, any> | null;
  tokenClaims?: Record<string, any> | null;
}): {
  isAdmin: boolean;
  isMaster: boolean;
  role: 'admin' | 'coach' | 'nutritionist' | 'doctor' | 'athlete';
} {
  const { adminDocExists, userDoc, tokenClaims } = params;

  // 1. Verificação oficial de Admin (Registro em /admins/{uid}, Custom Claims seguras do Admin SDK, ou /users/{uid} verificado)
  const isAdminByRegistry = Boolean(adminDocExists);
  const isAdminByClaim = Boolean(tokenClaims?.admin === true);
  const isAdminByDoc = Boolean(userDoc?.role === 'admin' && userDoc?.isAdmin === true);

  const isAdmin = isAdminByRegistry || isAdminByClaim || isAdminByDoc;

  // 2. Verificação de Master
  const isMaster = Boolean(
    isAdmin && (userDoc?.isMaster === true || tokenClaims?.isMaster === true)
  );

  // 3. Determinação de Role
  let role: 'admin' | 'coach' | 'nutritionist' | 'doctor' | 'athlete' = 'athlete';
  if (isAdmin) {
    role = 'admin';
  } else if (userDoc?.role && ['coach', 'nutritionist', 'doctor', 'athlete'].includes(userDoc.role)) {
    role = userDoc.role as any;
  }

  return {
    isAdmin,
    isMaster,
    role
  };
}

export type PrescriptionModality = 'workouts' | 'nutrition' | 'supplements';

export interface AthleteRelationshipContext {
  id: string;
  coachId?: string;
  nutritionistId?: string;
  doctorId?: string;
  assignedPrescriberIds?: string[];
}

export interface UserSecurityContext {
  uid: string;
  role: 'admin' | 'coach' | 'nutritionist' | 'doctor' | 'athlete';
  isAdmin?: boolean;
  assignedAthleteIds?: string[];
  athleteId?: string;
}

/**
 * Valida autorização de acesso e modificação a prescrições por modalidade e vínculo.
 * 
 * Regras:
 * - Admin possui acesso a todas as modalidades.
 * - Atleta dono possui apenas acesso de LEITURA (isWrite=false) às suas próprias prescrições.
 * - Treinos (workouts): Apenas Coach vinculado (ou Admin).
 * - Nutrição (nutrition): Apenas Nutricionista vinculado (ou Admin).
 * - Suplementos (supplements): Apenas Médico ou Nutricionista vinculado (ou Admin).
 * - Profissional não vinculado NÃO consegue ler nem modificar prescrições por nenhum caminho.
 */
export function validatePrescriptionAccess(params: {
  user: UserSecurityContext;
  modality: PrescriptionModality;
  athlete: AthleteRelationshipContext;
  isWrite: boolean;
}): ValidationResult {
  const { user, modality, athlete, isWrite } = params;

  if (!user || !user.uid) {
    return {
      isValid: false,
      code: 'UNAUTHORIZED',
      error: 'Usuário não autenticado.'
    };
  }

  // 1. Administrador tem acesso pleno
  if (user.isAdmin || user.role === 'admin') {
    return { isValid: true };
  }

  // 2. Verificação de Atleta dono (somente leitura)
  const isOwnerAthlete = user.uid === athlete.id || user.athleteId === athlete.id;
  if (isOwnerAthlete) {
    if (isWrite) {
      return {
        isValid: false,
        code: 'PRIVILEGE_ESCALATION',
        error: 'Atletas possuem acesso estritamente SOMENTE-LEITURA às suas prescrições oficiais.'
      };
    }
    return { isValid: true };
  }

  // Se não for o próprio atleta nem admin, deve ser profissional
  const isProfessional = ['coach', 'nutritionist', 'doctor'].includes(user.role);
  if (!isProfessional) {
    return {
      isValid: false,
      code: 'UNAUTHORIZED',
      error: 'Apenas profissionais autorizados ou o próprio atleta podem acessar prescrições.'
    };
  }

  // 3. Verificação de Vínculo Específico com o Atleta
  const hasUserAssignedList = Array.isArray(user.assignedAthleteIds) && user.assignedAthleteIds.includes(athlete.id);
  const hasAthletePrescriberList = Array.isArray(athlete.assignedPrescriberIds) && athlete.assignedPrescriberIds.includes(user.uid);

  const isDirectCoach = athlete.coachId === user.uid;
  const isDirectNutritionist = athlete.nutritionistId === user.uid;
  const isDirectDoctor = athlete.doctorId === user.uid;

  const isLinkedAsCoach = isDirectCoach || hasUserAssignedList || hasAthletePrescriberList;
  const isLinkedAsNutritionist = isDirectNutritionist || hasUserAssignedList || hasAthletePrescriberList;
  const isLinkedAsSupplementPrescriber = isDirectDoctor || isDirectNutritionist || hasUserAssignedList || hasAthletePrescriberList;

  // 4. Verificação por Modalidade de Prescrição
  if (modality === 'workouts') {
    if (user.role !== 'coach') {
      return {
        isValid: false,
        code: 'UNAUTHORIZED',
        error: `Acesso negado à modalidade 'workouts': papel '${user.role}' não autorizado para treinos.`
      };
    }
    if (!isLinkedAsCoach) {
      return {
        isValid: false,
        code: 'FORBIDDEN_LINK',
        error: 'Acesso negado: treinador não vinculado a este atleta.'
      };
    }
    return { isValid: true };
  }

  if (modality === 'nutrition') {
    if (user.role !== 'nutritionist') {
      return {
        isValid: false,
        code: 'UNAUTHORIZED',
        error: `Acesso negado à modalidade 'nutrition': papel '${user.role}' não autorizado para dietas.`
      };
    }
    if (!isLinkedAsNutritionist) {
      return {
        isValid: false,
        code: 'FORBIDDEN_LINK',
        error: 'Acesso negado: nutricionista não vinculado a este atleta.'
      };
    }
    return { isValid: true };
  }

  if (modality === 'supplements') {
    if (user.role !== 'doctor' && user.role !== 'nutritionist') {
      return {
        isValid: false,
        code: 'UNAUTHORIZED',
        error: `Acesso negado à modalidade 'supplements': papel '${user.role}' não autorizado para suplementação/manipulados.`
      };
    }
    if (!isLinkedAsSupplementPrescriber) {
      return {
        isValid: false,
        code: 'FORBIDDEN_LINK',
        error: 'Acesso negado: profissional de saúde não vinculado a este atleta para suplementos.'
      };
    }
    return { isValid: true };
  }

  return {
    isValid: false,
    code: 'UNAUTHORIZED',
    error: `Modalidade de prescrição desconhecida: ${modality}`
  };
}

/**
 * Valida e restringe consultas de listagem de atletas aos vínculos autorizados.
 * 
 * Regras:
 * - Admin pode listar todos os atletas.
 * - Profissionais só podem consultar atletas com os quais possuem vínculo
 *   (via coachId, nutritionistId, doctorId ou assignedPrescriberIds).
 * - Atleta só pode listar/consultar seu próprio registro.
 */
export function validateAthleteListQuery(params: {
  user: UserSecurityContext;
  queryFilter?: {
    field: string;
    operator: '==' | 'array-contains' | 'in';
    value: any;
  };
}): ValidationResult {
  const { user, queryFilter } = params;

  if (!user || !user.uid) {
    return {
      isValid: false,
      code: 'UNAUTHORIZED',
      error: 'Sessão não autenticada.'
    };
  }

  // Admin pode fazer consultas amplas
  if (user.isAdmin || user.role === 'admin') {
    return { isValid: true };
  }

  // Consultas sem filtros por usuários comuns/profissionais são proibidas
  if (!queryFilter) {
    return {
      isValid: false,
      code: 'UNAUTHORIZED',
      error: 'Consultas amplas a /athletes são restritas. Exige-se filtro de vínculo autorizado.'
    };
  }

  // Profissional consultando por vínculo
  if (['coach', 'nutritionist', 'doctor'].includes(user.role)) {
    const validRelationalFields = ['coachId', 'nutritionistId', 'doctorId', 'assignedPrescriberIds'];

    if (queryFilter.field === 'assignedPrescriberIds') {
      if (queryFilter.operator !== 'array-contains' || queryFilter.value !== user.uid) {
        return {
          isValid: false,
          code: 'FORBIDDEN_LINK',
          error: 'Consulta de atletas deve filtrar estritamente pelo UID do profissional autenticado.'
        };
      }
      return { isValid: true };
    }

    if (validRelationalFields.includes(queryFilter.field)) {
      if (queryFilter.operator !== '==' || queryFilter.value !== user.uid) {
        return {
          isValid: false,
          code: 'FORBIDDEN_LINK',
          error: `Consulta de atletas com filtro em '${queryFilter.field}' deve corresponder ao próprio UID.`
        };
      }
      return { isValid: true };
    }

    return {
      isValid: false,
      code: 'FORBIDDEN_LINK',
      error: `Campo de consulta '${queryFilter.field}' não autorizado para profissionais sem vínculo.`
    };
  }

  // Atleta consultando
  if (user.role === 'athlete') {
    if (queryFilter.field === 'id' && queryFilter.value === user.uid) {
      return { isValid: true };
    }
    return {
      isValid: false,
      code: 'UNAUTHORIZED',
      error: 'Atleta só pode consultar seu próprio perfil de atleta.'
    };
  }

  return {
    isValid: false,
    code: 'UNAUTHORIZED',
    error: 'Acesso negado para listagem de atletas.'
  };
}

/**
 * Sanitiza entidades (atletas, prescritores, usuários) removendo qualquer campo sensível de senha
 * Garante que password/accessPassword nunca existam em respostas de API, documentos, caches ou mocks
 */
export function sanitizeUserEntity<T extends Record<string, any>>(entity: T): Omit<T, 'password' | 'accessPassword' | 'tempPassword'> {
  if (!entity || typeof entity !== 'object') return entity;

  const sanitized = { ...entity };
  delete (sanitized as any).password;
  delete (sanitized as any).accessPassword;
  delete (sanitized as any).tempPassword;

  return sanitized as any;
}

/**
 * Validação rigorosa de status de conta no backend e cliente
 * Contas inativas são sumariamente bloqueadas de qualquer liberação de sessão
 */
export function validateAccountStatus(status?: string | null): {
  isValid: boolean;
  code?: 'ACCOUNT_INACTIVE' | 'INVALID_STATUS';
  error?: string;
} {
  if (!status) {
    return {
      isValid: false,
      code: 'INVALID_STATUS',
      error: 'Status da conta não informado.'
    };
  }

  const normalized = String(status).trim().toLowerCase();
  if (normalized === 'inativo' || normalized === 'inactive' || normalized === 'bloqueado' || normalized === 'suspended') {
    return {
      isValid: false,
      code: 'ACCOUNT_INACTIVE',
      error: 'Sua conta está inativa ou suspensa. Entre em contato com a administração da assessoria.'
    };
  }

  return { isValid: true };
}

/**
 * Validação de perfil autorizado: impede a fabricação de perfis profissionais quando ausentes no cadastro
 */
export function validateAuthorizedProfile(
  profile: Record<string, any> | null | undefined,
  portalArea: 'athlete' | 'prescriber'
): {
  isValid: boolean;
  code?: 'PROFILE_ABSENT' | 'UNAUTHORIZED_ROLE' | 'ACCOUNT_INACTIVE';
  error?: string;
} {
  if (!profile) {
    return {
      isValid: false,
      code: 'PROFILE_ABSENT',
      error: portalArea === 'prescriber'
        ? 'Cadastro profissional ausente no banco de dados. Perfis profissionais não podem ser fabricados automaticamente.'
        : 'Perfil de aluno não encontrado. Solicite seu cadastro ao seu treinador.'
    };
  }

  // Verifica status da conta
  const statusCheck = validateAccountStatus(profile.status);
  if (!statusCheck.isValid) {
    return {
      isValid: false,
      code: 'ACCOUNT_INACTIVE',
      error: statusCheck.error
    };
  }

  if (portalArea === 'prescriber') {
    const isStaff = profile.isAdmin === true || ['admin', 'coach', 'nutritionist', 'doctor', 'Prescritor', 'Administrador Geral', 'Head Coach', 'Nutricionista', 'Médico do Esporte', 'Fisioterapeuta'].includes(profile.roleType || profile.role);
    if (!isStaff) {
      return {
        isValid: false,
        code: 'UNAUTHORIZED_ROLE',
        error: 'Este usuário não possui papel de prescritor ou administrador autorizado.'
      };
    }
  }

  return { isValid: true };
}

/**
 * Validação de ciclo de vida de senha:
 * Testa se uma senha antiga é inequivocamente rejeitada após uma redefinição oficial
 */
export function verifyPasswordResetLifecycle(params: {
  currentEffectivePasswordHashOrSecret: string;
  candidatePasswordAttempt: string;
  previousPasswordAttempt?: string;
}): {
  isAccepted: boolean;
  wasOldPasswordRejected: boolean;
  reason?: string;
} {
  const { currentEffectivePasswordHashOrSecret, candidatePasswordAttempt, previousPasswordAttempt } = params;

  // Rejeição direta se a tentativa for a senha antiga
  const isCandidateOld = previousPasswordAttempt !== undefined && candidatePasswordAttempt === previousPasswordAttempt;
  if (isCandidateOld && candidatePasswordAttempt !== currentEffectivePasswordHashOrSecret) {
    return {
      isAccepted: false,
      wasOldPasswordRejected: true,
      reason: 'A senha antiga foi revogada pela redefinição e não é mais aceita pelo Firebase Auth.'
    };
  }

  const isAccepted = candidatePasswordAttempt === currentEffectivePasswordHashOrSecret;

  return {
    isAccepted,
    wasOldPasswordRejected: previousPasswordAttempt ? candidatePasswordAttempt !== previousPasswordAttempt : false,
    reason: isAccepted ? undefined : 'Credenciais inválidas.'
  };
}

