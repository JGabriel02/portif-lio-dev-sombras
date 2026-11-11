package dev.jg.painel.conteudo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import dev.jg.painel.TestcontainersConfig;
import dev.jg.painel.conteudo.ProjetoRepositorio.ProjetoResumo;

@SpringBootTest
@Import(TestcontainersConfig.class)
class ProjetoRepositorioTest {

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	ProjetoRepositorio repo;

	@BeforeEach
	void limpa() {
		jdbc.execute("delete from projeto");
	}

	private ProjetoForm form(String slug, boolean destaque) {
		ProjetoForm f = new ProjetoForm();
		f.setSlug(slug);
		f.setRepo("jg/" + slug);
		f.setDestaque(destaque);
		f.setStack("Java, Spring");
		f.setResumoPt("Resumo " + slug);
		return f;
	}

	private List<String> slugs() {
		return repo.listar().stream().map(ProjetoResumo::slug).toList();
	}

	@Test
	void criarComDestaqueDesmarcaOAnterior() {
		repo.criar(form("a", true));
		repo.criar(form("b", true));
		assertThat(repo.listar()).extracting(ProjetoResumo::slug, ProjetoResumo::destaque)
				.containsExactly(tuple("a", false), tuple("b", true));
	}

	@Test
	void atualizarComDestaqueDesmarcaOutroEGravaCampos() {
		repo.criar(form("a", true));
		repo.criar(form("b", false));
		ProjetoForm f = repo.buscar("b").orElseThrow();
		f.setDestaque(true);
		f.setDemoUrl("");
		f.setStack("X,Y");
		f.setFallbackEstrelas(7);
		f.setFallbackAtualizadoEm(LocalDate.of(2026, 1, 2));
		repo.atualizar("b", f);
		assertThat(repo.buscar("a").orElseThrow().isDestaque()).isFalse();
		ProjetoForm lido = repo.buscar("b").orElseThrow();
		assertThat(lido.isDestaque()).isTrue();
		assertThat(lido.getDemoUrl()).isNull();
		assertThat(lido.getStack()).isEqualTo("X, Y");
		assertThat(lido.getFallbackEstrelas()).isEqualTo(7);
		assertThat(lido.getFallbackAtualizadoEm()).isEqualTo(LocalDate.of(2026, 1, 2));
		assertThat(jdbc.queryForObject("select imagens::text from projeto where slug = 'b'", String.class))
				.isEqualTo("[]");
	}

	@Test
	void apagarODestacadoDeixaZeroDestaques() {
		repo.criar(form("a", true));
		repo.criar(form("b", false));
		repo.apagar("a");
		assertThat(repo.listar()).noneMatch(ProjetoResumo::destaque);
		assertThat(slugs()).containsExactly("b");
	}

	@Test
	void ordemEMaisUmENasPontasMoverNaoFazNada() {
		repo.criar(form("a", false));
		repo.criar(form("b", false));
		repo.criar(form("c", false));
		assertThat(repo.listar()).extracting(ProjetoResumo::ordem).containsExactly(1, 2, 3);
		repo.mover("a", -1);
		repo.mover("c", 1);
		assertThat(slugs()).containsExactly("a", "b", "c");
		repo.mover("a", 1);
		assertThat(slugs()).containsExactly("b", "a", "c");
	}

	@Test
	void moverComLacunasNaOrdem() {
		for (String s : List.of("a", "b", "c", "d", "e")) {
			repo.criar(form(s, false));
		}
		repo.apagar("a");
		repo.apagar("b");
		repo.mover("d", 1);
		assertThat(slugs()).containsExactly("c", "e", "d");
		repo.mover("d", -1);
		assertThat(slugs()).containsExactly("c", "d", "e");
	}

	@Test
	void textoEmBrancoViraNulo() {
		ProjetoForm f = form("a", false);
		f.setResumoEn("   ");
		f.setDescricaoPt("");
		repo.criar(f);
		assertThat(jdbc.queryForObject("select resumo_en from projeto where slug = 'a'", String.class)).isNull();
		assertThat(jdbc.queryForObject("select descricao_pt from projeto where slug = 'a'", String.class)).isNull();
		ProjetoForm lido = repo.buscar("a").orElseThrow();
		lido.setResumoEn("");
		repo.atualizar("a", lido);
		assertThat(jdbc.queryForObject("select resumo_en from projeto where slug = 'a'", String.class)).isNull();
	}

	@Test
	void buscarInexistenteVazio() {
		assertThat(repo.buscar("nada")).isEmpty();
	}
}
