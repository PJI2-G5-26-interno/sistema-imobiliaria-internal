alter table public.imoveis
  add column if not exists em_manutencao boolean not null default false,
  add column if not exists tipo_outro text;

update public.imoveis
set em_manutencao = true
where status = 'manutencao';

create or replace function public.validar_disponibilidade_contrato()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  imovel_em_manutencao boolean;
begin
  if new.status <> 'ativo' or new.imovel_id is null then
    return new;
  end if;

  select em_manutencao
  into imovel_em_manutencao
  from public.imoveis
  where id = new.imovel_id
  for update;

  if coalesce(imovel_em_manutencao, false) then
    if tg_op = 'INSERT' then
      raise exception 'Não é possível cadastrar um contrato ativo para um imóvel em manutenção.';
    elsif old.status <> 'ativo'
       or old.imovel_id is distinct from new.imovel_id then
      raise exception 'Não é possível cadastrar um contrato ativo para um imóvel em manutenção.';
    end if;
  end if;

  if exists (
    select 1
    from public.contratos existente
    where existente.imovel_id = new.imovel_id
      and existente.status = 'ativo'
      and existente.id <> coalesce(new.id, 0)
      and daterange(
        coalesce(existente.data_inicio, '-infinity'::date),
        coalesce(existente.data_fim, 'infinity'::date),
        '[]'
      ) && daterange(
        coalesce(new.data_inicio, '-infinity'::date),
        coalesce(new.data_fim, 'infinity'::date),
        '[]'
      )
  ) then
    raise exception 'Já existe um contrato ativo para este imóvel no período informado.';
  end if;

  return new;
end;
$$;

revoke all on function public.validar_disponibilidade_contrato() from public;
revoke all on function public.validar_disponibilidade_contrato() from anon, authenticated;

drop trigger if exists z_validar_disponibilidade_contrato on public.contratos;

create trigger z_validar_disponibilidade_contrato
before insert or update of imovel_id, status, data_inicio, data_fim
on public.contratos
for each row
execute function public.validar_disponibilidade_contrato();