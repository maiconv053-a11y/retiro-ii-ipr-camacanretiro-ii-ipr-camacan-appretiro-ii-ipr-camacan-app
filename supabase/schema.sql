create extension if not exists pgcrypto;

create table if not exists public.diretoria_usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  perfil text not null default 'diretoria'
    check (perfil in ('diretoria', 'financeiro', 'admin')),
  ativo boolean not null default true,
  ultimo_login_em timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.configuracoes_retiro (
  id text primary key default 'principal',
  valor_inscricao numeric(10, 2) not null default 380 check (valor_inscricao > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.participantes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  idade integer not null check (idade > 0),
  telefone text not null,
  restricoes_medicas text,
  restricoes_alimentares text,
  status_inscricao text not null default 'pendente'
    check (status_inscricao in ('confirmada', 'pendente', 'cancelada')),
  termo_aceito boolean not null default false,
  termo_aceito_em timestamptz,
  origem_inscricao text not null default 'diretoria'
    check (origem_inscricao in ('publica', 'diretoria')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financeiro (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null unique references public.participantes(id) on delete cascade,
  valor_total numeric(10, 2) not null default 0 check (valor_total >= 0),
  valor_pago numeric(10, 2) not null default 0 check (valor_pago >= 0),
  forma_pagamento text not null
    check (forma_pagamento in ('pix', 'dinheiro', 'boleto', 'cartao')),
  num_parcelas integer not null default 1 check (num_parcelas between 1 and 10),
  parcelas_pagas integer not null default 0 check (parcelas_pagas >= 0),
  status_geral text not null default 'pendente'
    check (status_geral in ('pendente', 'parcial', 'quitado')),
  status_validacao text not null default 'pendente_validacao'
    check (status_validacao in ('pendente_validacao', 'validado', 'rejeitado')),
  validado_por uuid references public.diretoria_usuarios(id) on delete set null,
  validado_em timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financeiro_parcelas (
  id uuid primary key default gen_random_uuid(),
  financeiro_id uuid not null references public.financeiro(id) on delete cascade,
  numero_parcela integer not null check (numero_parcela > 0),
  valor_parcela numeric(10, 2) not null check (valor_parcela >= 0),
  status text not null default 'pendente'
    check (status in ('paga', 'pendente')),
  vencimento date,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists financeiro_parcelas_unq
  on public.financeiro_parcelas (financeiro_id, numero_parcela);

alter table public.participantes
  add column if not exists termo_aceito boolean not null default false,
  add column if not exists termo_aceito_em timestamptz,
  add column if not exists origem_inscricao text not null default 'diretoria';

alter table public.financeiro
  add column if not exists status_validacao text not null default 'pendente_validacao',
  add column if not exists validado_por uuid references public.diretoria_usuarios(id) on delete set null,
  add column if not exists validado_em timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'participantes_origem_inscricao_check'
  ) then
    alter table public.participantes
      add constraint participantes_origem_inscricao_check
      check (origem_inscricao in ('publica', 'diretoria'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'financeiro_status_validacao_check'
  ) then
    alter table public.financeiro
      add constraint financeiro_status_validacao_check
      check (status_validacao in ('pendente_validacao', 'validado', 'rejeitado'));
  end if;
end $$;

create table if not exists public.checklist_organizacao (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  tarefa text not null,
  responsavel text,
  valor_estimado numeric(10, 2) not null default 0 check (valor_estimado >= 0),
  valor_gasto numeric(10, 2) not null default 0 check (valor_gasto >= 0),
  status text not null default 'pendente'
    check (status in ('pendente', 'em_andamento', 'concluido')),
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists participantes_status_idx
  on public.participantes (status_inscricao);

create index if not exists participantes_origem_idx
  on public.participantes (origem_inscricao);

create unique index if not exists diretoria_usuarios_email_idx
  on public.diretoria_usuarios (lower(email));

create index if not exists checklist_categoria_idx
  on public.checklist_organizacao (categoria);

insert into public.configuracoes_retiro (id, valor_inscricao)
values ('principal', 380)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists participantes_set_updated_at on public.participantes;
create trigger participantes_set_updated_at
before update on public.participantes
for each row
execute function public.set_updated_at();

drop trigger if exists diretoria_usuarios_set_updated_at on public.diretoria_usuarios;
create trigger diretoria_usuarios_set_updated_at
before update on public.diretoria_usuarios
for each row
execute function public.set_updated_at();

drop trigger if exists financeiro_set_updated_at on public.financeiro;
create trigger financeiro_set_updated_at
before update on public.financeiro
for each row
execute function public.set_updated_at();

drop trigger if exists checklist_set_updated_at on public.checklist_organizacao;
create trigger checklist_set_updated_at
before update on public.checklist_organizacao
for each row
execute function public.set_updated_at();

drop trigger if exists configuracoes_retiro_set_updated_at on public.configuracoes_retiro;
create trigger configuracoes_retiro_set_updated_at
before update on public.configuracoes_retiro
for each row
execute function public.set_updated_at();

alter table public.participantes enable row level security;
alter table public.financeiro enable row level security;
alter table public.financeiro_parcelas enable row level security;
alter table public.checklist_organizacao enable row level security;
alter table public.diretoria_usuarios enable row level security;
alter table public.configuracoes_retiro enable row level security;

revoke all on table public.participantes from anon, authenticated;
revoke all on table public.financeiro from anon, authenticated;
revoke all on table public.financeiro_parcelas from anon, authenticated;
revoke all on table public.checklist_organizacao from anon, authenticated;
revoke all on table public.diretoria_usuarios from anon, authenticated;
revoke all on table public.configuracoes_retiro from anon, authenticated;

comment on table public.participantes is 'Participantes do retiro';
comment on table public.financeiro is 'Resumo financeiro por participante';
comment on table public.financeiro_parcelas is 'Detalhamento das parcelas de boleto/cartão';
comment on table public.checklist_organizacao is 'Checklist operacional da organização';
comment on table public.diretoria_usuarios is 'Usuarios autorizados a acessar a area privada da diretoria';
comment on table public.configuracoes_retiro is 'Configuracoes centrais do retiro, incluindo valor fixo da inscricao';
