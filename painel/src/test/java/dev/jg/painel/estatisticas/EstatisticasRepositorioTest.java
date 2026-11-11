package dev.jg.painel.estatisticas;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;

import dev.jg.painel.TestcontainersConfig;

@SpringBootTest
@Import(TestcontainersConfig.class)
class EstatisticasRepositorioTest {

	private static final Instant AGORA = Instant.parse("2026-11-11T15:00:00Z");

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	JdbcClient jdbcClient;

	private EstatisticasRepositorio repo;

	@BeforeEach
	void limpa() {
		jdbc.execute("delete from visita");
		jdbc.execute("delete from evento");
		jdbc.execute("delete from mensagem");
		repo = new EstatisticasRepositorio(jdbcClient, Clock.fixed(AGORA, ZoneOffset.UTC));
	}

	private void visita(Instant quando, String origem, String pais, String hash) {
		jdbc.update("""
				insert into visita(criado_em, caminho, idioma, origem, aparelho, pais, visitante_hash)
				values (?, '/', 'pt', ?, 'desktop', ?, ?)
				""", Timestamp.from(quando), origem, pais, hash.repeat(64));
	}

	private void evento(String tipo) {
		jdbc.update("insert into evento(criado_em, tipo, visitante_hash) values (?, ?, ?)",
				Timestamp.from(AGORA), tipo, "e".repeat(64));
	}

	@Test
	void resumoConta_visitas_unicos_e_ignora_fora_do_periodo() {
		visita(AGORA, "direto", "BR", "a");
		visita(AGORA, "direto", "BR", "a");
		visita(AGORA, "direto", "BR", "b");
		visita(AGORA.minusSeconds(40L * 86400), "direto", "BR", "c");

		Resumo r = repo.resumo(Periodo.D30);

		assertThat(r.visitas()).isEqualTo(3);
		assertThat(r.unicos()).isEqualTo(2);
	}

	@Test
	void resumoConta_eventos_e_mensagens_nao_lidas() {
		evento("repo");
		evento("repo");
		evento("demo");
		evento("cv");
		evento("idioma");
		jdbc.update("insert into mensagem(nome, email, texto, lida) values ('a','a@a.com','x', false)");
		jdbc.update("insert into mensagem(nome, email, texto, lida) values ('b','b@b.com','y', true)");

		Resumo r = repo.resumo(Periodo.D7);

		assertThat(r.cliquesRepo()).isEqualTo(2);
		assertThat(r.cliquesDemo()).isEqualTo(1);
		assertThat(r.downloadsCv()).isEqualTo(1);
		assertThat(r.naoLidas()).isEqualTo(1);
	}

	@Test
	void serieUsaODiaDeSaoPaulo() {
		visita(Instant.parse("2026-11-11T01:00:00Z"), "direto", "BR", "a");

		List<PontoSerie> serie = repo.serie(Periodo.D7);

		assertThat(serie).contains(new PontoSerie(LocalDate.parse("2026-11-10"), 1));
		assertThat(serie).contains(new PontoSerie(LocalDate.parse("2026-11-11"), 0));
	}

	@Test
	void serieD7TemSetePontosComZeros() {
		visita(AGORA, "direto", "BR", "a");

		List<PontoSerie> serie = repo.serie(Periodo.D7);

		assertThat(serie).hasSize(7);
		assertThat(serie.get(0).dia()).isEqualTo(LocalDate.parse("2026-11-05"));
		assertThat(serie.get(0).visitas()).isZero();
		assertThat(serie.get(6)).isEqualTo(new PontoSerie(LocalDate.parse("2026-11-11"), 1));
	}

	@Test
	void serieM12AgrupaPorMes() {
		visita(AGORA, "direto", "BR", "a");
		visita(AGORA.minusSeconds(3L * 86400), "direto", "BR", "b");

		List<PontoSerie> serie = repo.serie(Periodo.M12);

		assertThat(serie).hasSizeBetween(12, 13);
		assertThat(serie).contains(new PontoSerie(LocalDate.parse("2026-11-01"), 2));
		assertThat(serie).allMatch(p -> p.dia().getDayOfMonth() == 1);
	}

	@Test
	void topOrigensExcluiInternoEOrdenaPorTotal() {
		visita(AGORA, "interno", "BR", "a");
		visita(AGORA, "interno", "BR", "a");
		visita(AGORA, "github.com", "BR", "a");
		visita(AGORA, "linkedin.com", "BR", "b");
		visita(AGORA, "linkedin.com", "BR", "c");

		List<Contagem> top = repo.topOrigens(Periodo.D30, 5);

		assertThat(top).extracting(Contagem::chave).containsExactly("linkedin.com", "github.com");
		assertThat(top.get(0).total()).isEqualTo(2);
	}

	@Test
	void topPaisesTrocaNuloPorInterrogacoes() {
		visita(AGORA, "direto", null, "a");
		visita(AGORA, "direto", "BR", "b");
		visita(AGORA, "direto", "BR", "c");

		assertThat(repo.topPaises(Periodo.D30, 5)).containsExactly(new Contagem("BR", 2), new Contagem("??", 1));
	}

	@Test
	void topPaginas_aparelho_e_idioma() {
		visita(AGORA, "direto", "BR", "a");

		assertThat(repo.topPaginas(Periodo.D30, 5)).containsExactly(new Contagem("/", 1));
		assertThat(repo.porAparelho(Periodo.D30)).containsExactly(new Contagem("desktop", 1));
		assertThat(repo.porIdioma(Periodo.D30)).containsExactly(new Contagem("pt", 1));
	}

	@Test
	void periodoInvalidoViraD30() {
		assertThat(Periodo.de("xyz")).isEqualTo(Periodo.D30);
		assertThat(Periodo.de(null)).isEqualTo(Periodo.D30);
		assertThat(Periodo.de("d7")).isEqualTo(Periodo.D7);
		assertThat(Periodo.de("m12")).isEqualTo(Periodo.M12);
	}

	@Test
	void inicioEOComecoDoDiaEmSaoPaulo() {
		assertThat(Periodo.D7.inicio(Clock.fixed(AGORA, ZoneOffset.UTC)))
				.isEqualTo(Instant.parse("2026-11-05T03:00:00Z"));
	}

	private void projeto(String slug) {
		jdbc.update("insert into projeto(slug, repo, ordem) values (?, 'r', 99)", slug);
	}

	private void visitaEm(String caminho, Instant quando) {
		jdbc.update("""
				insert into visita(criado_em, caminho, idioma, origem, aparelho, pais, visitante_hash)
				values (?, ?, 'pt', 'direto', 'desktop', 'BR', ?)
				""", Timestamp.from(quando), caminho, "a".repeat(64));
	}

	private void clique(String tipo, String alvo) {
		jdbc.update("insert into evento(criado_em, tipo, alvo, visitante_hash) values (?, ?, ?, ?)",
				Timestamp.from(AGORA), tipo, alvo, "e".repeat(64));
	}

	@Test
	void rankingContaPtEEnSemConfundirSlugsParecidos() {
		jdbc.execute("delete from projeto where slug like 'zz-%'");
		projeto("zz-forge");
		projeto("zz-forge-extra");
		projeto("zz-vazio");
		visitaEm("/pt/projetos/zz-forge", AGORA);
		visitaEm("/en/projetos/zz-forge", AGORA);
		visitaEm("/pt/projetos/zz-forge-extra", AGORA);
		visitaEm("/pt/projetos/zz-forge", AGORA.minusSeconds(100L * 86400));
		clique("repo", "zz-forge");
		clique("demo", "zz-forge");
		clique("demo", "zz-forge");

		List<RankingProjeto> r = repo.ranking(Periodo.D30).stream().filter(x -> x.slug().startsWith("zz-")).toList();

		assertThat(r).containsExactly(new RankingProjeto("zz-forge", 2, 1, 2),
				new RankingProjeto("zz-forge-extra", 1, 0, 0), new RankingProjeto("zz-vazio", 0, 0, 0));
		jdbc.execute("delete from projeto where slug like 'zz-%'");
	}

}
