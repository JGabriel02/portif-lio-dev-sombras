do $$
begin
	if not exists (select from pg_roles where rolname = 'site') then
		create role site nologin;
	end if;
end
$$;

grant usage on schema public to site;
grant insert on visita, evento, mensagem to site;
grant usage on sequence visita_id_seq, evento_id_seq, mensagem_id_seq to site;
grant select on projeto, skill to site;
