## Modulo de Notificacao e Cobranca Automatica

### Arquitetura adotada
- Agendador: GitHub Actions
- Horario: 08:00 da manha no Brasil (11:00 UTC no cron)
- Banco: Supabase
- WhatsApp: Evolution API
- E-mail: Resend
- Script principal: `scripts/send-due-notifications.mjs`

### Fluxo diario
1. O workflow `.github/workflows/due-notifications.yml` roda todo dia.
2. O script busca em `public.financeiro_parcelas` as parcelas com:
   - `vencimento = hoje`
   - `status = 'pendente'`
3. O script relaciona cada parcela ao registro de `financeiro` e ao `participante`.
4. Quando o metodo for `boleto`, `pix` ou `dinheiro`, ele tenta enviar:
   - primeiro por WhatsApp
   - depois por e-mail, se necessario
5. Cada tentativa fica registrada em `public.cobranca_notificacoes`.

### Secrets do GitHub Actions
Cadastre em `Settings > Secrets and variables > Actions`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REMINDER_TIMEZONE`
- `WHATSAPP_ENABLED`
- `EMAIL_ENABLED`
- `DRY_RUN`
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Ordem recomendada para ativacao
1. Executar o `supabase/schema.sql` atualizado no Supabase.
2. Preencher `.env` local com as variaveis novas.
3. Subir os mesmos valores como secrets do GitHub.
4. Manter `DRY_RUN=true` no primeiro teste.
5. Rodar manualmente o workflow por `workflow_dispatch`.
6. Conferir o resultado na tabela `cobranca_notificacoes`.
7. Mudar `DRY_RUN=false` depois da validacao.

### Teste local
```bash
npm run notifications:due
```

### Observacoes
- O script evita duplicidade por canal no mesmo dia usando a unique index em `cobranca_notificacoes`.
- A tabela de log registra envios com sucesso e erros.
- Se nao houver telefone valido ou o WhatsApp falhar, o script tenta o e-mail.
