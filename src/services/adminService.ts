import { auth, db, sendPasswordResetEmail, updatePassword, signOut, signInWithEmailAndPassword } from '../lib/firebase';
import { PrescriberProfile, AthleteProfile, AuditLog, UserProfile } from '../types';
import { collection, addDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

class AdminService {
  /**
   * Helper to get current Firebase Auth user ID Token
   */
  private async getIdToken(): Promise<string | null> {
    try {
      if (!auth.currentUser) return null;
      return await auth.currentUser.getIdToken(true);
    } catch (err) {
      console.warn('Error fetching ID token:', err);
      return null;
    }
  }

  /**
   * Fetch Authoritative User Profile and Permissions from Backend /api/auth/me
   */
  public async getAuthoritativeProfile(): Promise<{
    uid: string;
    email?: string;
    role: UserProfile['role'];
    isAdmin: boolean;
    isMaster: boolean;
    athleteId?: string;
    prescriberId?: string;
    assignedAthleteIds?: string[];
    profile?: UserProfile;
  } | null> {
    const token = await this.getIdToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      return data.user;
    } catch (err) {
      console.warn('Backend /api/auth/me unavailable, falling back to direct Firestore fetch:', err);
      // Fallback to direct Firestore getDoc
      if (auth.currentUser && db) {
        const uid = auth.currentUser.uid;
        const [userSnap, adminSnap] = await Promise.all([
          getDoc(doc(db, 'users', uid)),
          getDoc(doc(db, 'admins', uid))
        ]);
        const data = userSnap.data();
        const isAdmin = adminSnap.exists() || (data?.role === 'admin' && data?.isAdmin === true);
        const isMaster = isAdmin && (data?.isMaster === true || adminSnap.data()?.isMaster === true);
        const email = auth.currentUser.email || '';

        return {
          uid,
          email,
          role: isAdmin ? 'admin' : (data?.role || 'athlete'),
          isAdmin,
          isMaster,
          athleteId: data?.athleteId,
          prescriberId: data?.prescriberId,
          assignedAthleteIds: data?.assignedAthleteIds || []
        };
      }
      return null;
    }
  }

  /**
   * Administrative Operation: Create New Prescriber
   */
  public async createPrescriber(payload: Partial<PrescriberProfile>): Promise<{
    success: boolean;
    prescriber?: PrescriberProfile;
    error?: string;
  }> {
    const token = await this.getIdToken();
    if (!token) {
      return { success: false, error: 'Sessão expirada. Autentique-se como Administrador Geral.' };
    }

    try {
      const response = await fetch('/api/admin/create-prescriber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        return { success: true, prescriber: result.prescriber };
      }
      return { success: false, error: result.message || result.error || 'Falha ao criar prescritor.' };
    } catch (err: any) {
      console.error('API /api/admin/create-prescriber error:', err);
      return { success: false, error: `Falha de rede ao criar prescritor: ${err?.message || err}` };
    }
  }

  /**
   * Administrative Operation: Promote User or Prescriber to Admin
   */
  public async promoteAdmin(target: { prescriberId?: string; targetUid?: string }): Promise<{
    success: boolean;
    error?: string;
  }> {
    const token = await this.getIdToken();
    if (token) {
      try {
        const response = await fetch('/api/admin/promote-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(target)
        });
        const result = await response.json();
        if (response.ok && result.success) {
          return { success: true };
        }
        return { success: false, error: result.message || 'Falha ao promover administrador.' };
      } catch (err: any) {
        console.warn('API error, falling back:', err);
      }
    }

    // Fallback: direct Firestore write if permitted by rules
    if (db) {
      try {
        if (target.prescriberId) {
          await setDoc(doc(db, 'prescribers', target.prescriberId), { isAdmin: true, isMaster: true }, { merge: true });
        }
        if (target.targetUid) {
          await setDoc(doc(db, 'users', target.targetUid), { role: 'admin', isAdmin: true, isMaster: true }, { merge: true });
        }
        await this.logClientAudit({
          action: 'PROMOTE_ADMIN',
          resource: 'user',
          resourceId: target.targetUid || target.prescriberId || 'unknown',
          details: 'Administrador promovido.',
          changes: { isAdmin: true, role: 'admin' }
        });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    return { success: false, error: 'Não autenticado' };
  }

  /**
   * Administrative Operation: Update Athlete Assignments
   */
  public async updateAthleteAssignments(payload: {
    athleteId: string;
    coachId?: string;
    coachName?: string;
    nutritionistId?: string;
    nutritionistName?: string;
    doctorId?: string;
    doctorName?: string;
    assignedPrescriberIds?: string[];
  }): Promise<{ success: boolean; error?: string }> {
    const token = await this.getIdToken();
    if (!token) {
      return { success: false, error: 'Sessão expirada. Autentique-se como Administrador Geral.' };
    }

    try {
      const response = await fetch('/api/admin/update-athlete-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        return { success: true };
      }
      return { success: false, error: result.message || result.error || 'Falha ao atualizar vínculos.' };
    } catch (err: any) {
      console.error('API error updating athlete assignments:', err);
      return { success: false, error: `Falha de rede ao atualizar vínculos: ${err?.message || err}` };
    }
  }

  /**
   * Administrative Operation: Delete Record
   */
  public async deleteRecord(resource: 'prescriber' | 'athlete' | 'user', resourceId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const token = await this.getIdToken();
    if (token) {
      try {
        const response = await fetch('/api/admin/delete-record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ resource, resourceId })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          return { success: true };
        }
        return { success: false, error: result.message || 'Falha ao excluir registro.' };
      } catch (err) {
        console.warn('API error deleting record:', err);
      }
    }

    return { success: false, error: 'Falha na conexão' };
  }

  /**
   * Administrative Operation: Toggle Status
   */
  public async toggleStatus(resource: 'athlete' | 'prescriber', resourceId: string, nextStatus: 'Ativo' | 'Inativo'): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    const token = await this.getIdToken();
    if (token) {
      try {
        const response = await fetch('/api/admin/toggle-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ resource, resourceId, nextStatus })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          return { success: true, status: result.status };
        }
        return { success: false, error: result.message || 'Falha ao alterar status.' };
      } catch (err) {
        console.warn('API error toggling status:', err);
      }
    }

    return { success: false, error: 'Não autenticado' };
  }

  /**
   * Fetch Audit Logs from Backend
   */
  public async getAuditLogs(): Promise<AuditLog[]> {
    const token = await this.getIdToken();
    if (!token) return [];

    try {
      const response = await fetch('/api/admin/audit-logs', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.logs || [];
      }
    } catch (err) {
      console.warn('Error fetching audit logs:', err);
    }
    return [];
  }

  /**
   * Request Official Password Reset for Prescribers & Admins
   * Generates authoritative reset link and triggers official Firebase Auth reset email
   */
  public async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
    resetLink?: string;
    userCreated?: boolean;
    error?: string;
  }> {
    const cleanEmail = email.toLowerCase().trim();
    let resetLink: string | undefined;
    let userCreated = false;
    let serverMessage = '';

    // 1. Call Backend to provision user in Firebase Auth if needed and generate official link
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: cleanEmail })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        resetLink = result.resetLink;
        userCreated = Boolean(result.userCreated);
        serverMessage = result.message;
      }
    } catch (err) {
      console.warn('Backend password reset request notice:', err);
    }

    // 2. Also dispatch client-side Firebase Auth sendPasswordResetEmail
    let clientEmailSent = false;
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, cleanEmail);
        clientEmailSent = true;
      }
    } catch (err: any) {
      console.warn('Client sendPasswordResetEmail notice:', err?.code || err?.message);
    }

    return {
      success: true,
      message:
        serverMessage ||
        (clientEmailSent
          ? `E-mail de recuperação enviado para ${cleanEmail}.`
          : `Solicitação de recuperação processada com sucesso para ${cleanEmail}.`),
      resetLink,
      userCreated
    };
  }

  /**
   * Reset and Provision Master Admin Access
   */
  public async resetMasterAdminAccess(email?: string): Promise<{
    success: boolean;
    message?: string;
    resetLink?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/admin/reset-admin-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
          resetLink: result.resetLink
        };
      }
      return { success: false, error: result.message || 'Erro ao resetar acesso admin.' };
    } catch (err: any) {
      console.error('Error calling /api/admin/reset-admin-access:', err);
      return { success: false, error: err.message || 'Falha de comunicação com o servidor.' };
    }
  }

  /**
   * Prescriber / Admin Backend Authentication
   */
  /**
   * Unified Prescriber Login via Firebase Authentication
   * Validates credentials strictly in Firebase Auth and authoritative backend profile.
   */
  public async prescriberLogin(email: string, password: string): Promise<{
    success: boolean;
    profile?: PrescriberProfile;
    uid?: string;
    error?: string;
  }> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken(true);

      // Validate account status and authorized profile on the authoritative backend
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        await signOut(auth);
        return {
          success: false,
          error: data.message || 'Acesso negado: Perfil não autorizado ou conta inativa.'
        };
      }

      const prescriberProfile = data.user?.profile || data.user;
      if (!prescriberProfile || (!data.user?.isAdmin && data.user?.role === 'athlete')) {
        await signOut(auth);
        return {
          success: false,
          error: 'Perfil profissional não encontrado para esta conta.'
        };
      }

      return {
        success: true,
        profile: prescriberProfile,
        uid: fbUser.uid
      };
    } catch (err: any) {
      console.warn('Unified prescriber login error in Firebase Auth:', err);
      const code = err?.code || '';
      let errorMsg = 'E-mail ou senha incorretos.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        errorMsg = 'E-mail ou senha incorretos. Verifique suas credenciais ou solicite a redefinição de senha.';
      } else if (code === 'auth/too-many-requests') {
        errorMsg = 'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Reset Admin Password for Development Environment
   */
  public async resetAdminDevPassword(email?: string, password?: string): Promise<{
    success: boolean;
    message?: string;
    email?: string;
    newPassword?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/admin/set-admin-dev-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
          email: result.email,
          newPassword: result.newPassword
        };
      }
      return {
        success: false,
        error: result.message || 'Erro ao redefinir senha de desenvolvimento.'
      };
    } catch (err: any) {
      console.error('Error resetting admin dev password:', err);
      return {
        success: false,
        error: 'Falha ao conectar com o serviço de redefinição.'
      };
    }
  }

  /**
   * Unified Athlete Login via Firebase Authentication
   * Authenticates athlete credentials against Firebase Auth and backend /api/auth/me.
   */
  public async athleteLogin(phoneOrEmail: string, password: string): Promise<{
    success: boolean;
    athlete?: AthleteProfile;
    uid?: string;
    error?: string;
  }> {
    try {
      const cleanDigits = phoneOrEmail.replace(/\D/g, '');
      const loginEmail = phoneOrEmail.includes('@')
        ? phoneOrEmail.toLowerCase().trim()
        : `${cleanDigits}@athlete.lmteam.com`;

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken(true);

      // Validate account status & authorized profile on backend
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        await signOut(auth);
        return {
          success: false,
          error: data.message || 'Conta inativa ou não autorizada.'
        };
      }

      const athleteProfile = data.user?.profile || data.user;
      if (!athleteProfile) {
        await signOut(auth);
        return {
          success: false,
          error: 'Perfil de aluno não encontrado para esta conta.'
        };
      }

      return {
        success: true,
        athlete: athleteProfile,
        uid: fbUser.uid
      };
    } catch (err: any) {
      console.warn('Unified athlete login error in Firebase Auth:', err);
      const code = err?.code || '';
      let errorMsg = 'Telefone ou senha incorretos.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        errorMsg = 'Telefone ou senha incorretos. Solicite o link de acesso ou redefinição ao seu treinador.';
      } else if (code === 'auth/too-many-requests') {
        errorMsg = 'Muitas tentativas incorretas. Tente novamente em alguns minutos.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Administrative/Prescriber: Set or Update Athlete Access Password
   */
  public async setAthletePassword(athleteId: string, newPassword: string): Promise<{
    success: boolean;
    password?: string;
    error?: string;
  }> {
    const token = await this.getIdToken();
    if (!token) {
      return { success: false, error: 'Sessão expirada. Autentique-se como Administrador Geral.' };
    }

    try {
      const response = await fetch('/api/admin/set-athlete-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ athleteId, newPassword })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        return { success: true, password: result.password || newPassword };
      }
      return { success: false, error: result.message || result.error || 'Falha ao atualizar senha do aluno no Firebase Auth.' };
    } catch (err: any) {
      console.error('API error setting athlete password:', err);
      return { success: false, error: `Falha de rede ao atualizar senha do aluno: ${err?.message || err}` };
    }
  }

  /**
   * Administrative/Admin: Set or Update Prescriber Access Password
   */
  public async setPrescriberPassword(prescriberId: string, newPassword: string): Promise<{
    success: boolean;
    password?: string;
    message?: string;
    error?: string;
  }> {
    const token = await this.getIdToken();
    if (!token) {
      return { success: false, error: 'Sessão expirada. Autentique-se como Administrador Geral.' };
    }

    try {
      const response = await fetch('/api/admin/set-prescriber-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prescriberId, newPassword })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        return {
          success: true,
          password: result.password || newPassword,
          message: result.message || 'Senha do prescritor atualizada com sucesso no Firebase Auth.'
        };
      }
      return { success: false, error: result.message || result.error || 'Falha ao atualizar senha do prescritor no Firebase Auth.' };
    } catch (err: any) {
      console.error('API error setting prescriber password:', err);
      return { success: false, error: `Falha de rede ao atualizar senha do prescritor: ${err?.message || err}` };
    }
  }

  /**
   * Self-Service: Logged-in User Change Own Password
   */
  public async changeMyPassword(options: {
    newPassword: string;
    userId?: string;
    userType?: 'athlete' | 'prescriber' | 'admin';
    email?: string;
    phone?: string;
  }): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    const { newPassword, userId, userType, email, phone } = options;

    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    const cleanPassword = newPassword.trim();
    let clientUpdated = false;

    // 1. Try Firebase Auth client update if user is logged into Firebase Auth
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, cleanPassword);
        clientUpdated = true;
      } catch (fbAuthErr: any) {
        console.warn('Firebase Auth client updatePassword notice:', fbAuthErr?.code || fbAuthErr?.message);
      }
    }

    // 2. Call backend endpoint /api/auth/change-my-password with Bearer token if available
    const token = await this.getIdToken();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/auth/change-my-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: userId || auth.currentUser?.uid,
          userType,
          newPassword: cleanPassword,
          email: email || auth.currentUser?.email,
          phone
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        return { success: true, message: result.message || 'Senha alterada no Firebase Auth com sucesso!' };
      }
      if (!clientUpdated) {
        return { success: false, message: result.message || result.error || 'Falha ao alterar senha no Firebase Auth.', error: result.message || result.error };
      }
    } catch (err: any) {
      console.error('Backend change-my-password error:', err);
      if (!clientUpdated) {
        return { success: false, message: `Falha de conexão ao atualizar senha: ${err?.message || err}`, error: err?.message || err };
      }
    }

    if (clientUpdated) {
      return { success: true, message: 'Senha atualizada no Firebase Auth com sucesso!' };
    }

    return { success: false, message: 'Não foi possível atualizar a senha. Verifique sua conexão e tente novamente.', error: 'UPDATE_PASSWORD_FAILED' };
  }

  /**
   * Administrative/Migration: Migra usuários para Firebase Auth por convite/reset
   * e purga campos de senha do banco e memória
   */
  public async migrateUsersToAuth(): Promise<{
    success: boolean;
    migratedAthletes?: number;
    migratedPrescribers?: number;
    purgedFieldsCount?: number;
    resetLinks?: Array<{ email: string; resetLink: string; role: string }>;
    message?: string;
    error?: string;
  }> {
    const token = await this.getIdToken();
    try {
      const response = await fetch('/api/admin/migrate-users-to-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return data;
      }
      return { success: false, error: data.message || 'Falha na migração de usuários.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Client Audit Logging
   */
  public async logClientAudit(log: {
    action: AuditLog['action'];
    resource: AuditLog['resource'];
    resourceId: string;
    details?: string;
    changes?: Record<string, any>;
  }): Promise<void> {
    if (!auth.currentUser || !db) return;
    try {
      const logDoc = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        actorUid: auth.currentUser.uid,
        actorEmail: auth.currentUser.email || 'authenticated-user',
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        timestamp: new Date().toISOString(),
        details: log.details || '',
        changes: log.changes || {}
      };
      await addDoc(collection(db, 'audit_logs'), logDoc);
    } catch (e) {
      console.warn('Could not write client audit log:', e);
    }
  }

  /**
   * User Self-Registration (/users/{uid})
   * Protected with strict allowlist and zero-trust validation
   */
  public async selfRegister(data: Partial<UserProfile>): Promise<{ success: boolean; user?: any; error?: string }> {
    const token = await this.getIdToken();
    if (token) {
      try {
        const response = await fetch('/api/users/self-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (response.ok) {
          return { success: true, user: resData.user };
        }
        return { success: false, error: resData.message || resData.error };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Direct Firestore write (protected by security rules)
    if (auth.currentUser && db) {
      try {
        const uid = auth.currentUser.uid;
        const sanitizedData = {
          id: uid,
          email: auth.currentUser.email || '',
          name: data.name || 'Novo Aluno',
          role: 'athlete' as const,
          status: 'Ativo' as const,
          phone: data.phone,
          avatar: data.avatar,
          birthDate: data.birthDate,
          cpf: data.cpf,
          bio: data.bio,
          gender: data.gender,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', uid), sanitizedData);
        return { success: true, user: sanitizedData };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    return { success: false, error: 'Usuário não autenticado.' };
  }

  /**
   * User Self Profile Update (/users/{uid})
   * Prohibits athleteId, prescriberId, assignedAthleteIds, isAdmin, isMaster, role
   */
  public async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; profile?: any; error?: string }> {
    const token = await this.getIdToken();
    if (token) {
      try {
        const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        const resData = await response.json();
        if (response.ok) {
          return { success: true, profile: resData.profile };
        }
        return { success: false, error: resData.message || resData.error };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Direct Firestore update (protected by security rules)
    if (auth.currentUser && db) {
      try {
        const uid = auth.currentUser.uid;
        // Strip prohibited fields
        const { athleteId, prescriberId, assignedAthleteIds, isAdmin, isMaster, role, status, id, email, ...allowedUpdates } = updates as any;
        allowedUpdates.updatedAt = new Date().toISOString();
        await updateDoc(doc(db, 'users', uid), allowedUpdates);
        return { success: true, profile: allowedUpdates };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    return { success: false, error: 'Usuário não autenticado.' };
  }
}

export const adminService = new AdminService();
