update public.contratos
set cliente_id = cliente::bigint
where cliente_id is null
  and cliente ~ '^[0-9]+$';

update public.contratos
set imovel_id = imovel::bigint
where imovel_id is null
  and imovel ~ '^[0-9]+$';

update public.recebimentos recebimento
set contrato_id = contrato.id
from public.contratos contrato
where recebimento.contrato_id is null
  and recebimento.numero_contrato = contrato.numero
  and (
    select count(*)
    from public.contratos contrato_duplicado
    where contrato_duplicado.numero = contrato.numero
  ) = 1;

update public.contratos
set numero = 'CT-' || case
  when id < 1000 then lpad(id::text, 3, '0')
  else id::text
end;

alter table public.contratos
  alter column numero set not null;

create unique index if not exists contratos_numero_key
  on public.contratos (numero);

create or replace function public.gerar_numero_contrato()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is null then
    raise exception 'O id do contrato precisa ser gerado antes do código.';
  end if;

  new.numero := 'CT-' || case
    when new.id < 1000 then lpad(new.id::text, 3, '0')
    else new.id::text
  end;

  return new;
end;
$$;

revoke all on function public.gerar_numero_contrato() from public;
revoke all on function public.gerar_numero_contrato() from anon, authenticated;

drop trigger if exists contratos_gerar_numero on public.contratos;

create trigger contratos_gerar_numero
before insert or update on public.contratos
for each row
execute function public.gerar_numero_contrato();

update public.recebimentos recebimento
set cliente_id = contrato.cliente_id,
    numero_contrato = contrato.numero
from public.contratos contrato
where recebimento.contrato_id = contrato.id
  and contrato.cliente_id is not null;

create or replace function public.sync_recebimento_contrato()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  cliente_do_contrato bigint;
  numero_do_contrato text;
begin
  if new.contrato_id is null then
    return new;
  end if;

  select cliente_id, numero
  into cliente_do_contrato, numero_do_contrato
  from public.contratos
  where id = new.contrato_id;

  if not found then
    raise exception 'O contrato selecionado não existe.';
  end if;

  if cliente_do_contrato is null then
    raise exception 'O contrato selecionado não possui cliente vinculado.';
  end if;

  if new.cliente_id is not null
     and new.cliente_id <> cliente_do_contrato then
    raise exception 'O cliente do recebimento deve ser o cliente do contrato.';
  end if;

  new.cliente_id := cliente_do_contrato;
  new.numero_contrato := numero_do_contrato;

  return new;
end;
$$;

revoke all on function public.sync_recebimento_contrato() from public;
revoke all on function public.sync_recebimento_contrato() from anon, authenticated;

drop trigger if exists recebimentos_sync_contrato on public.recebimentos;

create trigger recebimentos_sync_contrato
before insert or update of contrato_id, cliente_id
on public.recebimentos
for each row
execute function public.sync_recebimento_contrato();