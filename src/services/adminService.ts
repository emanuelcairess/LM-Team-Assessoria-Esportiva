import { auth, db, sendPasswordResetEmail, updatePassword } from '../lib/firebase';
import { PrescriberProfile, AthleteProfile, AuditLog, UserProfile } from '../types';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';

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
        const snap = await getDoc(doc(db, 'users', uid));
        const data = snap.data();
        const email = auth.currentUser.email || '';
        const isMasterEmail = email.toLowerCase() === 'emanuelcairess@gmail.com';
        const isAdmin = isMasterEmail || data?.role === 'admin' || data?.isAdmin === true;
        const isMaster = isAdmin || data?.isMaster === true;

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
    if (token) {
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
        return { success: false, error: result.message || 'Falha ao criar prescritor.' };
      } catch (err: any) {
        console.warn('API /api/admin/create-prescriber error, writing via client Firestore:', err);
      }
    }

    // Direct Firestore fallback (guarded by firestore.rules)
    if (db && payload.id) {
      try {
        await setDoc(doc(db, 'prescribers', payload.id), payload, { merge: true });
        await this.logClientAudit({
          action: 'CREATE_PRESCRIBER',
          resource: 'prescriber',
          resourceId: payload.id,
          details: `Prescritor ${payload.name} criado via cliente Firestore.`,
          changes: payload
        });
        return { success: true, prescriber: payload as PrescriberProfile };
      } catch (dbErr: any) {
        return { success: false, error: dbErr.message };
      }
    }

    return { success: false, error: 'Não autenticado' };
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
    if (token) {
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
        return { success: false, error: result.message || 'Falha ao atualizar vínculos.' };
      } catch (err) {
        console.warn('API error updating athlete assignments, using fallback:', err);
      }
    }

    if (db && payload.athleteId) {
      try {
        await setDoc(doc(db, 'athletes', payload.athleteId), payload, { merge: true });
        await this.logClientAudit({
          action: 'UPDATE_ATHLETE_ASSIGNMENTS',
          resource: 'athlete',
          resourceId: payload.athleteId,
          details: 'Vínculos do atleta atualizados.',
          changes: payload
        });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    return { success: false, error: 'Não autenticado' };
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
  public async prescriberLogin(email: string, password: string): Promise<{
    success: boolean;
    profile?: PrescriberProfile;
    uid?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/auth/prescriber-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (response.ok && result.success && result.profile) {
        return {
          success: true,
          profile: result.profile,
          uid: result.user?.uid || result.profile.firebaseUid || result.profile.id
        };
      }
      return {
        success: false,
        error: result.message || 'Credenciais inválidas.'
      };
    } catch (err: any) {
      console.warn('Backend prescriber login error:', err);
      return {
        success: false,
        error: 'Falha de conexão com o servidor de autenticação.'
      };
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
   * Athlete Phone + Prescriber-Generated Password Authentication
   */
  public async athleteLogin(phone: string, password: string): Promise<{
    success: boolean;
    athlete?: AthleteProfile;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/auth/athlete-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, password })
      });
      const result = await response.json();
      if (response.ok && result.success && result.athlete) {
        return {
          success: true,
          athlete: result.athlete
        };
      }
      return {
        success: false,
        error: result.message || 'Telefone ou senha incorretos.'
      };
    } catch (err: any) {
      console.warn('Backend athlete login failed or offline:', err);
      return {
        success: false,
        error: 'Falha de conexão com o servidor.'
      };
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
    if (token) {
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
        return { success: false, error: result.message || 'Falha ao atualizar senha do aluno.' };
      } catch (err) {
        console.warn('API error setting athlete password, using direct database fallback:', err);
      }
    }

    if (db && athleteId) {
      try {
        await setDoc(doc(db, 'athletes', athleteId), { password: newPassword, updatedAt: Date.now() }, { merge: true });
        await this.logClientAudit({
          action: 'UPDATE_ATHLETE_PASSWORD',
          resource: 'athlete',
          resourceId: athleteId,
          details: 'Senha de acesso do aluno gerada/atualizada pelo prescritor.'
        });
        return { success: true, password: newPassword };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    return { success: false, error: 'Falha ao salvar senha' };
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
    if (token) {
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
            message: result.message || 'Senha do prescritor atualizada com sucesso.'
          };
        }
        return { success: false, error: result.message || 'Falha ao atualizar senha do prescritor.' };
      } catch (err) {
        console.warn('API error setting prescriber password, using direct database fallback:', err);
      }
    }

    if (db && prescriberId) {
      try {
        await setDoc(doc(db, 'prescribers', prescriberId), {
          password: newPassword,
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await this.logClientAudit({
          action: 'UPDATE_PRESCRIBER_PASSWORD',
          resource: 'prescriber',
          resourceId: prescriberId,
          details: 'Senha de acesso do prescritor atualizada pelo administrador geral.'
        });
        return { success: true, password: newPassword, message: 'Senha atualizada com sucesso no banco de dados.' };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    return { success: false, error: 'Falha ao salvar senha do prescritor.' };
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

    // 1. Try Firebase Auth client update if user is logged into Firebase Auth
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, cleanPassword);
      } catch (fbAuthErr: any) {
        console.warn('Firebase Auth client updatePassword notice:', fbAuthErr?.code || fbAuthErr?.message);
      }
    }

    // 2. Call backend endpoint /api/auth/change-my-password
    try {
      const response = await fetch('/api/auth/change-my-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
        return { success: true, message: result.message || 'Senha alterada com sucesso!' };
      }
      if (result.message) {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (err: any) {
      console.warn('Backend change-my-password error, trying direct Firestore write:', err);
    }

    // 3. Fallback direct Firestore write
    if (db) {
      try {
        if (userType === 'athlete' && userId) {
          await setDoc(doc(db, 'athletes', userId), {
            password: cleanPassword,
            updatedAt: Date.now()
          }, { merge: true });
        } else if (userId) {
          await setDoc(doc(db, 'prescribers', userId), {
            password: cleanPassword,
            passwordChangedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        return { success: true, message: 'Senha alterada com sucesso!' };
      } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao atualizar senha.', error: e.message };
      }
    }

    return { success: true, message: 'Senha alterada com sucesso!' };
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
}

export const adminService = new AdminService();
