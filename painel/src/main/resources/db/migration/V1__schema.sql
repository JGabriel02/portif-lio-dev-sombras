create table visita (
	id bigserial primary key,
	criado_em timestamptz not null default now(),
	caminho text not null check (char_length(caminho) <= 200),
	idioma text check (idioma in ('pt', 'en')),
	origem text not null,
	aparelho text check (aparelho in ('mobile', 'desktop')),
	pais char(2),
	visitante_hash char(64) not null
);

create table evento (
	id bigserial primary key,
	criado_em timestamptz not null default now(),
	tipo text not null check (tipo in ('repo', 'demo', 'cv', 'contato', 'idioma')),
	alvo text check (char_length(alvo) <= 100),
	idioma text,
	visitante_hash char(64) not null
);

create table mensagem (
	id bigserial primary key,
	criado_em timestamptz not null default now(),
	nome text not null,
	email text not null,
	texto text not null,
	lida boolean not null default false
);

create table projeto (
	slug text primary key,
	repo text not null,
	ordem int not null,
	destaque boolean not null default false,
	publicado boolean not null default true,
	demo_url text,
	ocultar_demo boolean not null default false,
	stack text[] not null default '{}',
	imagens jsonb not null default '[]',
	resumo_pt text,
	resumo_en text,
	descricao_pt text,
	descricao_en text,
	aprendizados_pt text,
	aprendizados_en text,
	fallback_linguagem text,
	fallback_estrelas int,
	fallback_atualizado_em date,
	atualizado_em timestamptz not null default now()
);

create table skill (
	id serial primary key,
	nome text not null unique,
	categoria text not null check (categoria in ('frontend', 'backend', 'tools')),
	anos int not null,
	aprendendo boolean not null default false,
	linguagem_github text,
	ordem int not null
);

create index visita_criado_em_idx on visita (criado_em);
create index evento_criado_em_idx on evento (criado_em);
create index evento_tipo_alvo_idx on evento (tipo, alvo);
create unique index projeto_um_destaque on projeto ((true)) where destaque;
