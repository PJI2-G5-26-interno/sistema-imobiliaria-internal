alter table public.clientes
  add column if not exists conjuge text,
  add column if not exists telefone_secundario text;
