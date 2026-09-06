# Especificação de Segurança Firestore (Zero-Trust Security Spec) - LM Team Assessoria

## 1. Princípios e Invariantes de Dados

1. **Autenticação Obrigatória em Todas as Operações**: Nenhuma leitura ou escrita é permitida para usuários anônimos ou não autenticados (`request.auth == null`). O fallback global padrão é `allow read, write: if false;`.
2. **Separação Rígida por Papéis (RBAC / ABAC)**:
   - `admin`: Controle administrativo irrestrito (criação de profissionais, atribuição de permissões, gerenciamento de papéis e exclusão de contas).
   - `coach` (Treinador): Leitura e prescrição de treinos apenas para atletas explicitamente vinculados (`assignedAthleteIds` ou vínculo direto).
   - `nutritionist` (Nutricionista): Leitura e prescrição de dietas e planos nutricionais apenas para atletas vinculados.
   - `doctor` (Médico): Leitura e prescrição de manipulados e acompanhamento metabólico apenas para atletas vinculados.
   - `athlete` (Atleta): Leitura e escrita restritas estritamente aos seus próprios dados de perfil, check-ins de séries/refeições/suplementos e leitura de suas próprias prescrições.
3. **Imutabilidade e Prevenção de Escalação de Privilégios (Anti-Privilege Escalation)**:
   - Atletas e profissionais não podem alterar seu próprio `role`, `isAdmin`, `isMaster` ou `assignedAthleteIds`.
   - Na criação de contas (`/users/{uid}`), usuários comuns só podem criar documentos com role `athlete`. Qualquer papel elevado exige autorização de `admin`.
4. **Proteção de Dados Sensíveis e de Saúde (LGPD / HIPAA Compliance)**:
   - Avaliações antropométricas, fotos corporais, dados de peso e histórico médico de um atleta só podem ser visualizados pelo próprio atleta e por profissionais explicitamente vinculados.
5. **Prescrições Somente-Leitura para Atletas**:
   - Atletas nunca podem alterar prescrições oficiais de treinos, dietas ou fórmulas. Apenas o profissional responsável ou o administrador podem criar/editar prescrições.

---

## 2. As "Doze Cargas Maliciosas" (The Dirty Dozen Payloads)

Esta seção define 12 vetores de ataque reais testados contra as regras de segurança:

1. **Payload 1 (Ataque de Escalação de Privilégios no Registro)**:
   - *Tentativa*: Usuário não autenticado ou atleta recém-criado envia payload `{ "role": "admin", "email": "hacker@evil.com" }` para `/users/hackerUid`.
   - *Resultado Esperado*: `PERMISSION_DENIED` (Apenas `role: 'athlete'` é permitido no auto-registro ou criação por admin).
2. **Payload 2 (Auto-Promoção para Admin via Update)**:
   - *Tentativa*: Atleta autenticado tenta atualizar `/users/{athleteUid}` com `{ "role": "admin" }` ou `{ "isAdmin": true }`.
   - *Resultado Esperado*: `PERMISSION_DENIED` (Campos de controle de acesso são imutáveis pelo usuário).
3. **Payload 3 (Leitura Não Autorizada de Perfil de Saúde de Outro Atleta)**:
   - *Tentativa*: Atleta A (`uid: "ath_01"`) tenta ler `/athletes/ath_02` ou `/athletes/ath_02/anthropometric_evaluations/eval_99`.
   - *Resultado Esperado*: `PERMISSION_DENIED`.
4. **Payload 4 (Invasão de Prescrição por Atleta)**:
   - *Tentativa*: Atleta A tenta alterar a prescrição de treino em `/prescriptions/workouts/athletes/ath_01`.
   - *Resultado Esperado*: `PERMISSION_DENIED` (Atletas têm acesso somente-leitura às suas prescrições).
5. **Payload 5 (Espionagem por Profissional Não Vinculado)**:
   - *Tentativa*: Coach B tenta ler os check-ins e dados de saúde de um atleta vinculado exclusivamente ao Coach A (`assignedAthleteIds: ["ath_01"]`, tentando ler `ath_99`).
   - *Resultado Esperado*: `PERMISSION_DENIED`.
6. **Payload 6 (Criação Ilegal de Profissional sem Ser Admin)**:
   - *Tentativa*: Coach autenticado tenta criar um novo perfil de prescritor ou médico em `/prescribers/doc_new`.
   - *Resultado Esperado*: `PERMISSION_DENIED` (Apenas `admin` pode criar registros em `/prescribers`).
7. **Payload 7 (Tentativa de Leitura Pública / Não Autenticada)**:
   - *Tentativa*: Cliente anônimo (`auth: null`) tenta listar ou obter documentos de `/athletes`, `/users` ou `/prescriptions`.
   - *Resultado Esperado*: `PERMISSION_DENIED`.
8. **Payload 8 (Injeção de ID Malicioso / ID Poisoning Attack)**:
   - *Tentativa*: Requisição contendo documento com ID malicioso de 2KB ou caracteres de escape `/athletes/../../../hack`.
   - *Resultado Esperado*: `PERMISSION_DENIED` (Validado por `isValidId()`).
9. **Payload 9 (Exclusão Não Autorizada do Banco de Exercícios)**:
   - *Tentativa*: Atleta tenta deletar um exercício do catálogo oficial em `/exercises/ex_supino`.
   - *Resultado Esperado*: `PERMISSION_DENIED` (Apenas profissionais e admins podem gerenciar o banco).
10. **Payload 10 (Adulteração de Check-in Alheio)**:
    - *Tentativa*: Atleta A tenta gravar um check-in de treino em `/athletes/ath_02/exercise_set_checkins/set_01`.
    - *Resultado Esperado*: `PERMISSION_DENIED`.
11. **Payload 11 (Auto-Vinculação de Atleta por Coach Malicioso)**:
    - *Tentativa*: Coach tenta atualizar seu próprio documento em `/users/{coachUid}` adicionando `assignedAthleteIds: ["ath_vip"]` sem aprovação do admin.
    - *Resultado Esperado*: `PERMISSION_DENIED`.
12. **Payload 12 (Tentativa de Modificação da Coleção de Administradores)**:
    - *Tentativa*: Usuário não-admin tenta criar ou editar documento em `/admins/{uid}`.
    - *Resultado Esperado*: `PERMISSION_DENIED`.

---

## 3. Matriz de Controle de Acesso (RBAC Matrix)

| Coleção / Recurso | Não Autenticado | Atleta (Dono) | Atleta (Outro) | Profissional Vinculado | Profissional Não Vinculado | Admin |
|---|---|---|---|---|---|---|
| `/users/{uid}` | Bloqueado | Read, Update (dados básicos) | Bloqueado | Read (se atleta vinculado) | Bloqueado | Read, Create, Update, Delete |
| `/athletes/{id}` | Bloqueado | Read, Update (métricas/perfil) | Bloqueado | Read, Update | Bloqueado | Read, Create, Update, Delete |
| `/athletes/{id}/checkins/**` | Bloqueado | Read, Create, Update, Delete | Bloqueado | Read, Create, Update | Bloqueado | Read, Create, Update, Delete |
| `/prescriptions/**` | Bloqueado | Read | Bloqueado | Read, Create, Update, Delete | Bloqueado | Read, Create, Update, Delete |
| `/prescribers/{id}` | Bloqueado | Read (básico se vinculado) | Read (básico) | Read, Update (próprio bio) | Read (básico) | Read, Create, Update, Delete |
| `/exercises/{id}` | Bloqueado | Read | Read | Read, Create, Update | Read, Create, Update | Read, Create, Update, Delete |
| `/workout_templates/**` | Bloqueado | Read | Read | Read, Create, Update | Read, Create, Update | Read, Create, Update, Delete |
| `/admins/{id}` | Bloqueado | Bloqueado | Bloqueado | Bloqueado | Bloqueado | Read, Create, Update, Delete |
