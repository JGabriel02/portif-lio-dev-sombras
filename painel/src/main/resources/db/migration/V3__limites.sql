-- Limites contra abuso do formulário e da coleta, aplicados pelo próprio banco.
-- A role `site` não tem SELECT nessas tabelas, então as contagens rodam em
-- funções SECURITY DEFINER (com o dono do schema) chamadas por triggers.

alter table mensagem add column visitante_hash char(64);
alter table mensagem add constraint mensagem_tamanhos check (
	char_length(nome) <= 100 and char_length(email) <= 254 and char_length(texto) <= 2000
);

create index mensagem_hash_dia on mensagem (visitante_hash, criado_em);
create index visita_hash_dia on visita (visitante_hash, criado_em);
create index evento_hash_dia on evento (visitante_hash, criado_em);

-- Mensagens: acima do limite a inserção falha (o site mostra erro ao visitante).
create function limitar_mensagem() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
	inicio timestamptz := date_trunc('day', now());
begin
	if (select count(*) from mensagem where criado_em >= inicio) >= 100 then
		raise exception 'limite diário de mensagens atingido' using errcode = 'P0001';
	end if;
	if new.visitante_hash is not null and (
		select count(*) from mensagem where visitante_hash = new.visitante_hash and criado_em >= inicio
	) >= 5 then
		raise exception 'limite de mensagens por visitante atingido' using errcode = 'P0001';
	end if;
	return new;
end
$$;

-- Visitas e eventos: acima do limite a linha é descartada em silêncio.
create function limitar_coleta() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
	inicio timestamptz := date_trunc('day', now());
	por_visitante int := tg_argv[0]::int;
	total_dia int := tg_argv[1]::int;
	n int;
begin
	execute format('select count(*) from %I where visitante_hash = $1 and criado_em >= $2', tg_table_name)
		into n using new.visitante_hash, inicio;
	if n >= por_visitante then
		return null;
	end if;
	execute format('select count(*) from %I where criado_em >= $1', tg_table_name)
		into n using inicio;
	if n >= total_dia then
		return null;
	end if;
	return new;
end
$$;

revoke all on function limitar_mensagem() from public;
revoke all on function limitar_coleta() from public;

create trigger mensagem_limite before insert on mensagem
	for each row execute function limitar_mensagem();
create trigger visita_limite before insert on visita
	for each row execute function limitar_coleta('500', '50000');
create trigger evento_limite before insert on evento
	for each row execute function limitar_coleta('300', '20000');
