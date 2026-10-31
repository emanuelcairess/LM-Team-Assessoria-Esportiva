/**
 * ==============================================================================
 * SIMULAÇÃO COMPLETA DE PERSISTÊNCIA DE PRESCRIÇÃO E GESTÃO DE SENHAS
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

describe('Simulação de Criação, Persistência e Definição de Senha de Prescritor', () => {
  const testPrescriberId = 'presc-1793458233091';
  const testPrescriberData = {
    id: testPrescriberId,
    name: 'Professor Rogério Personal',
    email: 'rogerio.personal@lmteam.com.br',
    roleType: 'Head Coach',
    phone: '(11) 98888-7777',
    birthDate: '1988-04-12',
    crm_crn_cref: 'CREF 098765-G/SP',
    isAdmin: false,
    isMaster: false,
    status: 'Ativo'
  };

  it('1. Deve criar novo prescritor com sucesso via /api/admin/create-prescriber', async () => {
    const res = await request(app)
      .post('/api/admin/create-prescriber')
      .set('x-coach-session', 'coach_admin')
      .send(testPrescriberData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.prescriber).toBeDefined();
    expect(res.body.prescriber.id).toBe(testPrescriberId);
    expect(res.body.prescriber.name).toBe(testPrescriberData.name);
  });

  it('2. Deve listar o novo prescritor via GET /api/prescribers', async () => {
    const res = await request(app)
      .get('/api/prescribers');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.prescribers)).toBe(true);

    const found = res.body.prescribers.find((p: any) => p.id === testPrescriberId);
    expect(found).toBeDefined();
    expect(found.name).toBe(testPrescriberData.name);
    expect(found.email).toBe(testPrescriberData.email);
  });

  it('3. Deve definir senha para o prescritor presc-1793458233091 sem retornar 404 (status 200, success: true)', async () => {
    const res = await request(app)
      .post('/api/admin/set-prescriber-password')
      .set('x-coach-session', 'coach_admin')
      .send({
        prescriberId: testPrescriberId,
        newPassword: 'Personal10'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('sucesso');
  });

  it('4. Deve auto-recuperar (auto-heal) prescritor não encontrado previamente e definir senha com sucesso sem 404', async () => {
    const unseededPrescriberId = `presc-autoheal-${Date.now()}`;
    const res = await request(app)
      .post('/api/admin/set-prescriber-password')
      .set('x-coach-session', 'coach_admin')
      .send({
        prescriberId: unseededPrescriberId,
        newPassword: 'Personal10',
        name: 'Prescritor AutoHeal',
        email: 'autoheal@lmteam.com.br',
        roleType: 'Nutricionista'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Certificar que foi persistido e listado
    const listRes = await request(app).get('/api/prescribers');
    expect(listRes.status).toBe(200);
    const found = listRes.body.prescribers.find((p: any) => p.id === unseededPrescriberId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Prescritor AutoHeal');
  });

  it('5. Deve permitir consultar o banco de exercícios via GET /api/exercises sem erro de permissão', async () => {
    const res = await request(app).get('/api/exercises');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.exercises)).toBe(true);
  });

  it('6. Deve rejeitar senhas com menos de 6 caracteres com 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .post('/api/admin/set-prescriber-password')
      .set('x-coach-session', 'coach_admin')
      .send({
        prescriberId: testPrescriberId,
        newPassword: '123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BAD_REQUEST');
  });
});
