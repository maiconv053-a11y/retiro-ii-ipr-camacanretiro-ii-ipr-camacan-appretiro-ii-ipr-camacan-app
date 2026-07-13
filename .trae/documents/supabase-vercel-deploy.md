## 1. Arquitetura Recomendada
- Frontend: React + Vite hospedado na Vercel
- Backend: rotas `/api/*` do próprio projeto rodando como funções serverless na Vercel
- Banco: Supabase Postgres
- Segurança: a `SUPABASE_SERVICE_ROLE_KEY` fica apenas no backend; o frontend nunca acessa essa chave

## 2. Variáveis de Ambiente
Crie um arquivo `.env` local com:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY_DO_SUPABASE
VITE_API_BASE_URL=http://localhost:3001
```

No deploy da Vercel, defina `VITE_API_BASE_URL` como vazio para o frontend usar a mesma origem publicada:

```env
VITE_API_BASE_URL=
```

## 3. Banco de Dados no Supabase
1. Acesse o painel do Supabase.
2. Crie um novo projeto.
3. Abra `SQL Editor`.
4. Cole e execute o arquivo [schema.sql](file:///C:/Users/cecel/AppData/Roaming/TRAE%20SOLO/ModularData/ai-agent/work-mode-projects/6a5466fafba1439b3d9f57b4/supabase/schema.sql).
5. Copie as credenciais:
   - `Project URL` -> `SUPABASE_URL`
   - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY`

## 4. GitHub e Deploy Automático
1. Inicialize o Git se ainda não existir:

```bash
git init
git add .
git commit -m "feat: integra banco Supabase e prepara deploy"
```

2. Crie um repositório no GitHub.
3. Conecte o repositório local:

```bash
git remote add origin https://github.com/SEU-USUARIO/retiro-ii-ipr-camacan.git
git branch -M main
git push -u origin main
```

4. Entre em [Vercel](https://vercel.com/).
5. Clique em `Add New Project`.
6. Importe o repositório do GitHub.
7. Mantenha a configuração padrão do projeto.
8. Garanta que o arquivo `vercel.json` seja mantido no repositório para reescrever `/api/*` e as rotas do SPA corretamente.

## 5. Variáveis na Vercel
No projeto da Vercel, abra:
- `Settings`
- `Environment Variables`

Cadastre:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_API_BASE_URL` com valor vazio

Depois clique em `Redeploy`.

## 6. Fluxo de Atualização
Cada novo push no GitHub dispara deploy automático:

```bash
git add .
git commit -m "feat: atualiza sistema do retiro"
git push
```

## 7. Checklist de Produção
- Confirmar que o `schema.sql` foi executado
- Confirmar variáveis de ambiente no ambiente local e na Vercel
- Confirmar que as rotas `/api/health`, `/api/participants` e `/api/logistics` respondem
- Executar `npm run build`
- Executar `npm run lint`
- Executar `npm run test:run`
- Publicar no GitHub
- Validar o deploy gerado pela Vercel

## 8. Próxima Evolução Recomendada
Para uma operação real com múltiplos membros da organização, a próxima etapa recomendada é adicionar autenticação administrativa com Supabase Auth para restringir acesso por usuário.
