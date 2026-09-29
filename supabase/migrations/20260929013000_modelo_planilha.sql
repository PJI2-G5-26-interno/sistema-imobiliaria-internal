-- Modelo da planilha de controle de aluguéis.
-- Mantém as colunas que o sistema já grava e acrescenta
-- proprietário, contas de consumo e o vínculo do contrato.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.proprietarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  pix_chave text,
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  rg text,
  telefone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.imoveis (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  titulo text,
  tipo text not null default 'Casa',
  finalidade text not null default 'Aluguel',
  status text not null default 'disponivel',
  valor numeric(14, 2),
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  descricao text,
  observacoes text,
  proprietario_id uuid references public.proprietarios (id),
  elektro_codigo text,
  elektro_medidor text,
  sabesp_fornecimento text,
  rgi_sabesp text,
  hidrometro_sabesp text,
  iptu text,
  created_at timestamptz not null default now()
);

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  numero text,
  cliente text,
  imovel text,
  cliente_id uuid references public.clientes (id),
  imovel_id uuid references public.imoveis (id),
  tipo text not null default 'Aluguel',
  status text not null default 'ativo',
  data_inicio date,
  data_fim date,
  valor numeric(14, 2),
  dia_pagamento smallint,
  informacao text,
  recebe_na_conta text,
  created_at timestamptz not null default now(),
  constraint contratos_dia_pagamento_valido
    check (dia_pagamento is null or dia_pagamento between 1 and 31)
);

create table if not exists public.recebimentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes (id),
  contrato_id uuid references public.contratos (id),
  tipo_recebimento text,
  numero_contrato text,
  descricao text,
  valor numeric(14, 2),
  data_vencimento date,
  data_pagamento date,
  forma_pagamento text,
  status text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid references public.imoveis (id),
  categoria text,
  descricao text,
  valor numeric(14, 2),
  data_despesa date,
  forma_pagamento text,
  status text,
  "observações" text,
  created_at timestamptz not null default now()
);

create index if not exists imoveis_proprietario_id_idx
  on public.imoveis (proprietario_id);

create index if not exists contratos_cliente_id_idx
  on public.contratos (cliente_id);

create index if not exists contratos_imovel_id_idx
  on public.contratos (imovel_id);

create index if not exists recebimentos_contrato_id_idx
  on public.recebimentos (contrato_id);

create index if not exists recebimentos_data_vencimento_idx
  on public.recebimentos (data_vencimento);

create index if not exists despesas_imovel_id_idx
  on public.despesas (imovel_id);

create index if not exists despesas_data_despesa_idx
  on public.despesas (data_despesa);

create or replace function public.sync_contrato_refs()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.cliente ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    new.cliente_id := new.cliente::uuid;
  end if;

  if new.imovel ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    new.imovel_id := new.imovel::uuid;
  end if;

  return new;
end;
$$;

drop trigger if exists contratos_sync_refs on public.contratos;

create trigger contratos_sync_refs
before insert or update on public.contratos
for each row
execute function public.sync_contrato_refs();

alter table public.profiles enable row level security;
alter table public.proprietarios enable row level security;
alter table public.clientes enable row level security;
alter table public.imoveis enable row level security;
alter table public.contratos enable row level security;
alter table public.recebimentos enable row level security;
alter table public.despesas enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.proprietarios to authenticated;
grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.imoveis to authenticated;
grant select, insert, update, delete on public.contratos to authenticated;
grant select, insert, update, delete on public.recebimentos to authenticated;
grant select, insert, update, delete on public.despesas to authenticated;

drop policy if exists "login le profiles" on public.profiles;
create policy "login le profiles"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "autenticado gerencia proprietarios" on public.proprietarios;
create policy "autenticado gerencia proprietarios"
on public.proprietarios
for all
to authenticated
using (true)
with check (true);

drop policy if exists "autenticado gerencia clientes" on public.clientes;
create policy "autenticado gerencia clientes"
on public.clientes
for all
to authenticated
using (true)
with check (true);

drop policy if exists "autenticado gerencia imoveis" on public.imoveis;
create policy "autenticado gerencia imoveis"
on public.imoveis
for all
to authenticated
using (true)
with check (true);

drop policy if exists "autenticado gerencia contratos" on public.contratos;
create policy "autenticado gerencia contratos"
on public.contratos
for all
to authenticated
using (true)
with check (true);

drop policy if exists "autenticado gerencia recebimentos" on public.recebimentos;
create policy "autenticado gerencia recebimentos"
on public.recebimentos
for all
to authenticated
using (true)
with check (true);

drop policy if exists "autenticado gerencia despesas" on public.despesas;
create policy "autenticado gerencia despesas"
on public.despesas
for all
to authenticated
using (true)
with check (true);
