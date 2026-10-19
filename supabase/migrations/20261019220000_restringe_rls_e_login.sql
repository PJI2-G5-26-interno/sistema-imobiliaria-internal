-- Hardening: anon não lê profiles; só admin ativo opera nas tabelas de negócio.

create or replace function public.eh_admin_ativo()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and ativo = true
  );
$$;

revoke all on function public.eh_admin_ativo() from public, anon, authenticated;
grant execute on function public.eh_admin_ativo() to authenticated;

create or replace function public.resolver_email_admin(p_nome text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if p_nome is null or length(trim(p_nome)) = 0 or length(p_nome) > 120 then
    return null;
  end if;

  select email
    into v_email
  from public.profiles
  where nome = trim(p_nome)
    and ativo = true
  limit 1;

  return v_email;
end;
$$;

revoke all on function public.resolver_email_admin(text) from public, anon, authenticated;
grant execute on function public.resolver_email_admin(text) to anon, authenticated;

drop policy if exists "login le profiles" on public.profiles;

revoke select on table public.profiles from anon;
grant select on table public.profiles to authenticated;

create policy "usuario le o proprio profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "autenticado gerencia clientes" on public.clientes;
drop policy if exists "autenticado gerencia imoveis" on public.imoveis;
drop policy if exists "autenticado gerencia informacoes adicionais" on public.informacoes_adicionais_imoveis;
drop policy if exists "autenticado gerencia contratos" on public.contratos;
drop policy if exists "autenticado gerencia recebimentos" on public.recebimentos;
drop policy if exists "autenticado gerencia despesas" on public.despesas;

create policy "admin ativo gerencia clientes"
on public.clientes
for all
to authenticated
using (public.eh_admin_ativo())
with check (public.eh_admin_ativo());

create policy "admin ativo gerencia imoveis"
on public.imoveis
for all
to authenticated
using (public.eh_admin_ativo())
with check (public.eh_admin_ativo());

create policy "admin ativo gerencia informacoes adicionais"
on public.informacoes_adicionais_imoveis
for all
to authenticated
using (public.eh_admin_ativo())
with check (public.eh_admin_ativo());

create policy "admin ativo gerencia contratos"
on public.contratos
for all
to authenticated
using (public.eh_admin_ativo())
with check (public.eh_admin_ativo());

create policy "admin ativo gerencia recebimentos"
on public.recebimentos
for all
to authenticated
using (public.eh_admin_ativo())
with check (public.eh_admin_ativo());

create policy "admin ativo gerencia despesas"
on public.despesas
for all
to authenticated
using (public.eh_admin_ativo())
with check (public.eh_admin_ativo());
