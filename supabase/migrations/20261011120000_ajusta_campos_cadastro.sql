alter table public.imoveis
  drop column if exists codigo;

alter table public.contratos
  alter column numero drop not null;

alter table public.despesas
  alter column categoria drop not null;