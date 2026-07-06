# Arquitetura de dados — Firestore

Multi-tenant: cada negócio é `businesses/{businessId}`, onde **`businessId === uid do dono (admin)`**.
Todas as coleções de domínio são subcoleções do negócio.

```
businesses/{businessId}
├── sessions/{sessionId}          → GRADE DE HORÁRIOS (disponíveis / bloqueados)
├── reservations/{reservationId}  → HORÁRIOS RESERVADOS POR ALUNO
├── customers/{customerId}        → alunos (saldo de créditos, perfil)
├── payments/{paymentId}          → pagamentos
├── packages/{packageId}          → pacotes de aulas
└── progress-logs/{logId}         → evolução do aluno
```

## sessions — a grade de horários
Cada documento é **um horário** (data + hora + local).

| campo | tipo | descrição |
|-------|------|-----------|
| date | string `YYYY-MM-DD` | data da aula |
| startTime / endTime | string `HH:MM` | intervalo (slots de 1h, 05h–18h) |
| location | `maracaipe` \| `praia_do_borete` | local |
| status | `available` \| `blocked` \| `full` \| `cancelled` | estado do horário |
| maxCapacity / currentCapacity | number | vagas totais / ocupadas |

- **Liberar** (admin) → cria documento com `status: available`.
- **Limpar/bloquear** (admin) → apaga o documento se estiver **sem reservas**; mantém se houver alunos inscritos.
- Vira indisponível para os alunos quando `currentCapacity >= maxCapacity`.

Gerenciado por `src/lib/firebase/sessions.ts`.

## reservations — reservas por aluno
Liga um aluno a uma sessão. Campos de data/hora/local são **desnormalizados** da
sessão para consultas rápidas (reservas do dia / do aluno) sem joins.

| campo | descrição |
|-------|-----------|
| sessionId | sessão reservada |
| date / startTime / endTime / location | cópia da sessão |
| customerId / customerName | aluno |
| status | `reserved` \| `confirmed` \| `completed` \| `cancelled` \| `no_show` |
| payment | `credit` (usou parafina) \| `pix` (paga por fora, reporta o comprovante) |
| creditsUsed | 0 ou 1 |

Gerenciado por `src/lib/firebase/reservations.ts`.
A reserva (`createReservation`) é atômica (batch): cria a reserva + ocupa a vaga
da sessão + desconta 1 crédito do aluno (quando `payment = credit`).

Não existe mais "pagar na hora da aula". As únicas formas de pagamento são:
cartão de crédito (Stripe, comprando um pacote de parafinas em `/aluno/pacotes`)
ou PIX (chave CPF do Ivan + comprovante por WhatsApp — ver `src/constants/payment.ts`).

**Fluxo PIX**: ao reservar sem parafinas disponíveis, a reserva nasce com
`payment: "pix"` e `status: "reserved"` — a vaga já fica bloqueada para outros
alunos mesmo sem pagamento confirmado. O aluno paga por fora e clica em
"Já fiz o pagamento" (`confirmPixPayment`), que muda o status para `confirmed`.
Reservas pagas com crédito já nascem `confirmed` (pagamento já efetivado).

**Cancelamento** (`cancelReservation`): só é permitido até 24h antes do início
da aula (o aluno; sem restrição para o admin). Sempre devolve 1 crédito quando
`creditsUsed > 0` (pagou com parafina) ou quando `payment === "pix"` e
`status === "confirmed"` (já tinha pago via PIX) — nesse caso o crédito
devolvido vira 1 parafina para usar em outra aula.

## Camada de acesso (organização do código)
```
src/lib/firebase/
├── config.ts        → init do Firebase (app, auth, db, storage)
├── firestore.ts     → helpers genéricos (queryDocuments, where, orderBy…)
├── sessions.ts      → grade de horários
├── reservations.ts  → reservas por aluno
├── customers.ts     → alunos / créditos
└── payments.ts      → pagamentos
```

## Regras de segurança (resumo)
- `sessions`: leitura **pública** (landing). Admin cria/remove; aluno só pode
  **incrementar `currentCapacity` em 1** ao reservar (sem passar do máximo).
- `reservations`: aluno cria a **própria** e lê as **próprias**; admin gerencia todas.
- `customers`: admin gerencia; aluno lê o próprio perfil e pode **gastar 1 crédito**
  do próprio saldo (decrementar em 1, sem ficar negativo).
