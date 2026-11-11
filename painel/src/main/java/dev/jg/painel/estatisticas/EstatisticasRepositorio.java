package dev.jg.painel.estatisticas;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class EstatisticasRepositorio {

	private static final String DIA_SP = "(v.criado_em at time zone 'America/Sao_Paulo')";

	private final JdbcClient jdbc;

	private final Clock clock;

	public EstatisticasRepositorio(JdbcClient jdbc, Clock clock) {
		this.jdbc = jdbc;
		this.clock = clock;
	}

	public Resumo resumo(Periodo periodo) {
		Timestamp inicio = Timestamp.from(periodo.inicio(clock));
		return jdbc.sql("""
				select
					(select count(*) from visita where criado_em >= :inicio) as visitas,
					(select count(distinct visitante_hash) from visita where criado_em >= :inicio) as unicos,
					(select count(*) from evento where criado_em >= :inicio and tipo = 'repo') as repo,
					(select count(*) from evento where criado_em >= :inicio and tipo = 'demo') as demo,
					(select count(*) from evento where criado_em >= :inicio and tipo = 'cv') as cv,
					(select count(*) from mensagem where not lida) as nao_lidas
				""")
				.param("inicio", inicio)
				.query((rs, n) -> new Resumo(rs.getLong("visitas"), rs.getLong("unicos"), rs.getLong("repo"),
						rs.getLong("demo"), rs.getLong("cv"), rs.getLong("nao_lidas")))
				.single();
	}

	public long naoLidas() {
		return jdbc.sql("select count(*) from mensagem where not lida").query(Long.class).single();
	}

	public List<PontoSerie> serie(Periodo periodo) {
		LocalDate hoje = clock.instant().atZone(Periodo.SAO_PAULO).toLocalDate();
		LocalDate primeiro = periodo.inicio(clock).atZone(Periodo.SAO_PAULO).toLocalDate();
		Timestamp inicio = Timestamp.from(periodo.inicio(clock));
		String passo = periodo.porMes() ? "month" : "day";
		String intervalo = periodo.porMes() ? "1 month" : "1 day";
		String sql = """
				select g.dia::date as dia, count(v.id) as visitas
				from generate_series(date_trunc('%1$s', cast(:primeiro as date)), cast(:hoje as date),
						interval '%2$s') as g(dia)
				left join visita v
					on date_trunc('%1$s', %3$s)::date = g.dia::date and v.criado_em >= :inicio
				group by g.dia
				order by g.dia
				""".formatted(passo, intervalo, DIA_SP);
		return jdbc.sql(sql)
				.param("primeiro", Date.valueOf(primeiro))
				.param("hoje", Date.valueOf(hoje))
				.param("inicio", inicio)
				.query((rs, n) -> new PontoSerie(rs.getDate("dia").toLocalDate(), rs.getLong("visitas")))
				.list();
	}

	public List<Contagem> topPaginas(Periodo periodo, int limite) {
		return contagens("select caminho as chave, count(*) as total from visita v where criado_em >= :inicio "
				+ "group by caminho order by total desc, chave limit :limite", periodo, limite);
	}

	public List<Contagem> topOrigens(Periodo periodo, int limite) {
		return contagens("select origem as chave, count(*) as total from visita v where criado_em >= :inicio "
				+ "and origem <> 'interno' group by origem order by total desc, chave limit :limite", periodo, limite);
	}

	public List<Contagem> topPaises(Periodo periodo, int limite) {
		return contagens("select coalesce(pais, '??') as chave, count(*) as total from visita v "
				+ "where criado_em >= :inicio group by 1 order by total desc, chave limit :limite", periodo, limite);
	}

	public List<Contagem> porAparelho(Periodo periodo) {
		return contagens("select coalesce(aparelho, '??') as chave, count(*) as total from visita v "
				+ "where criado_em >= :inicio group by 1 order by total desc, chave limit :limite", periodo, 10);
	}

	public List<Contagem> porIdioma(Periodo periodo) {
		return contagens("select coalesce(idioma, '??') as chave, count(*) as total from visita v "
				+ "where criado_em >= :inicio group by 1 order by total desc, chave limit :limite", periodo, 10);
	}

	public List<RankingProjeto> ranking(Periodo periodo) {
		return jdbc.sql("""
				select * from (
				select p.slug,
					(select count(*) from visita v where v.criado_em >= :inicio
						and v.caminho in ('/pt/projetos/' || p.slug, '/en/projetos/' || p.slug)) as visualizacoes,
					(select count(*) from evento e where e.criado_em >= :inicio
						and e.alvo = p.slug and e.tipo = 'repo') as cliques_repo,
					(select count(*) from evento e where e.criado_em >= :inicio
						and e.alvo = p.slug and e.tipo = 'demo') as cliques_demo
				from projeto p
				) r
				order by visualizacoes desc, cliques_repo + cliques_demo desc, slug
				""")
				.param("inicio", Timestamp.from(periodo.inicio(clock)))
				.query((rs, n) -> new RankingProjeto(rs.getString("slug"), rs.getLong("visualizacoes"),
						rs.getLong("cliques_repo"), rs.getLong("cliques_demo")))
				.list();
	}

	private List<Contagem> contagens(String sql, Periodo periodo, int limite) {
		return jdbc.sql(sql)
				.param("inicio", Timestamp.from(periodo.inicio(clock)))
				.param("limite", limite)
				.query((rs, n) -> new Contagem(rs.getString("chave"), rs.getLong("total")))
				.list();
	}

}
