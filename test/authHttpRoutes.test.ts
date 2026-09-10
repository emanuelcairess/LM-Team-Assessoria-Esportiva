/**
 * ==============================================================================
 * SUÍTE DE TESTES DAS ROTAS HTTP DE AUTENTICAÇÃO E AUTORIZAÇÃO
 * LM TEAM ASSESSORIA ESPORTIVA
 * ==============================================================================
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createExpressApp } from '../server';

let app: any;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  app = createExpressApp();
});

describe('Rotas HTTP de Autenticação e Sessão - LM Team API', () => {
  describe('GET /api/health', () => {
    it('deve responder com status 200 e confirmar serviço ativo', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toContain('LM Team');
    });
  });

  describe('POST /api/auth/lookup-identifier', () => {
    it('deve rejeitar requisição sem identificador (400 BAD_REQUEST)', async () => {
      const res = await request(app)
        .post('/api/auth/lookup-identifier')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BAD_REQUEST');
    });

    it('deve rejeitar identificador com apenas espaços em branco (400 BAD_REQUEST)', async () => {
      const res = await request(app)
        .post('/api/auth/lookup-identifier')
        .send({ identifier: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BAD_REQUEST');
    });
  });

  describe('POST /api/demo/lookup-identifier', () => {
    it('deve rejeitar requisição demo sem identificador com 400', async () => {
      const res = await request(app)
        .post('/api/demo/lookup-identifier')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BAD_REQUEST');
    });

    it('deve localizar com sucesso o atleta Emanuel Caires no repositório demo', async () => {
      const res = await request(app)
        .post('/api/demo/lookup-identifier')
        .send({ identifier: 'emanuelcairess@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.type).toBe('athlete');
      expect(res.body.name).toBe('Emanuel Caires');
    });

    it('deve localizar atleta pelo telefone formatado ou numérico', async () => {
      const res = await request(app)
        .post('/api/demo/lookup-identifier')
        .send({ identifier: '61983414090' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.name).toBe('Emanuel Caires');
    });

    it('deve localizar o prescritor master pelo e-mail oficial', async () => {
      const res = await request(app)
        .post('/api/demo/lookup-identifier')
        .send({ identifier: 'lucas.mendes@lmteam.com.br' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.type).toBe('prescriber');
      expect(res.body.name).toBe('Dr. Lucas Mendes');
      expect(res.body.role).toBe('Head Coach');
    });

    it('deve retornar 404 para usuário demo não encontrado', async () => {
      const res = await request(app)
        .post('/api/demo/lookup-identifier')
        .send({ identifier: 'desconhecido_99999@teste.com' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('Proteção de Rotas com Middleware authenticateUser', () => {
    it('GET /api/auth/me sem cabeçalho Authorization deve retornar 401 UNAUTHENTICATED', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHENTICATED');
    });

    it('GET /api/auth/me com formato de token não-Bearer deve retornar 401 UNAUTHENTICATED', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat 12345');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHENTICATED');
    });

    it('GET /api/auth/me com token falso/expirado deve retornar 401 INVALID_TOKEN', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido_de_teste_123');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_TOKEN');
    });

    it('POST /api/auth/validate-session sem cabeçalho deve retornar 401', async () => {
      const res = await request(app).post('/api/auth/validate-session');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHENTICATED');
    });

    it('POST /api/users/self-register sem autenticação deve retornar 401', async () => {
      const res = await request(app)
        .post('/api/users/self-register')
        .send({ name: 'Hacker', role: 'admin' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHENTICATED');
    });

    it('POST /api/auth/change-my-password sem autenticação deve retornar 401', async () => {
      const res = await request(app)
        .post('/api/auth/change-my-password')
        .send({ currentPassword: '123', newPassword: '456' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHENTICATED');
    });

    it('PUT /api/users/profile sem autenticação deve retornar 401', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .send({ name: 'Alteração Indevida' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHENTICATED');
    });

    it('POST /api/admin/create-prescriber sem autenticação deve retornar 401', async () => {
      const res = await request(app)
        .post('/api/admin/create-prescriber')
        .send({ email: 'novo@lmteam.com' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHENTICATED');
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('deve rejeitar requisição sem e-mail com 400 INVALID_EMAIL', async () => {
      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_EMAIL');
    });

    it('deve rejeitar e-mail com formato inválido com 400 INVALID_EMAIL', async () => {
      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'email_sem_arroba' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_EMAIL');
    });
  });
});
