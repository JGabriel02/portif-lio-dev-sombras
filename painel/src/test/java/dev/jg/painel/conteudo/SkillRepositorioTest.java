package dev.jg.painel.conteudo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;

import dev.jg.painel.TestcontainersConfig;
import dev.jg.painel.conteudo.SkillRepositorio.Skill;

@SpringBootTest
@Import(TestcontainersConfig.class)
class SkillRepositorioTest {

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	SkillRepositorio repo;

	@BeforeEach
	void limpa() {
		jdbc.execute("delete from skill");
	}

	private SkillForm form(String nome) {
		SkillForm f = new SkillForm();
		f.setNome(nome);
		f.setCategoria("backend");
		f.setAnos(3);
		return f;
	}

	private List<String> nomes() {
		return repo.listar().stream().map(Skill::nome).toList();
	}

	@Test
	void atualizarIdInexistenteDevolveZero() {
		assertThat(repo.atualizar(123456, form("Java"))).isZero();
		repo.criar(form("Java"));
		assertThat(repo.atualizar(repo.listar().get(0).id(), form("Java"))).isEqualTo(1);
	}

	@Test
	void criaEListaEmOrdemSequencial() {
		repo.criar(form("Java"));
		repo.criar(form("Spring"));
		assertThat(repo.listar()).extracting(Skill::nome, Skill::ordem)
				.containsExactly(tuple("Java", 1), tuple("Spring", 2));
	}

	@Test
	void linguagemGithubEmBrancoViraNulo() {
		SkillForm f = form("Java");
		f.setLinguagemGithub("  ");
		repo.criar(f);
		assertThat(repo.listar().get(0).linguagemGithub()).isNull();
		SkillForm g = form("Java");
		g.setLinguagemGithub("Java");
		repo.atualizar(repo.listar().get(0).id(), g);
		assertThat(repo.listar().get(0).linguagemGithub()).isEqualTo("Java");
		g.setLinguagemGithub("");
		repo.atualizar(repo.listar().get(0).id(), g);
		assertThat(repo.listar().get(0).linguagemGithub()).isNull();
	}

	@Test
	void atualizaCampos() {
		repo.criar(form("Java"));
		SkillForm f = form("Kotlin");
		f.setCategoria("tools");
		f.setAnos(9);
		f.setAprendendo(true);
		repo.atualizar(repo.listar().get(0).id(), f);
		Skill s = repo.listar().get(0);
		assertThat(s.nome()).isEqualTo("Kotlin");
		assertThat(s.categoria()).isEqualTo("tools");
		assertThat(s.anos()).isEqualTo(9);
		assertThat(s.aprendendo()).isTrue();
	}

	@Test
	void nomeDuplicadoLancaDuplicateKey() {
		repo.criar(form("Java"));
		assertThatThrownBy(() -> repo.criar(form("Java"))).isInstanceOf(DuplicateKeyException.class);
		repo.criar(form("Go"));
		int idGo = repo.listar().get(1).id();
		assertThatThrownBy(() -> repo.atualizar(idGo, form("Java"))).isInstanceOf(DuplicateKeyException.class);
	}

	@Test
	void apagar() {
		repo.criar(form("Java"));
		repo.criar(form("Go"));
		repo.apagar(repo.listar().get(0).id());
		assertThat(nomes()).containsExactly("Go");
	}

	@Test
	void moverTrocaENasPontasNaoFazNada() {
		for (String n : List.of("a", "b", "c")) {
			repo.criar(form(n));
		}
		int a = repo.listar().get(0).id();
		int c = repo.listar().get(2).id();
		repo.mover(a, -1);
		repo.mover(c, 1);
		assertThat(nomes()).containsExactly("a", "b", "c");
		repo.mover(a, 1);
		assertThat(nomes()).containsExactly("b", "a", "c");
	}

	@Test
	void moverComLacunasNaOrdem() {
		for (String n : List.of("a", "b", "c", "d", "e")) {
			repo.criar(form(n));
		}
		repo.apagar(repo.listar().get(0).id());
		repo.apagar(repo.listar().get(0).id());
		int d = repo.listar().get(1).id();
		repo.mover(d, 1);
		assertThat(nomes()).containsExactly("c", "e", "d");
		assertThat(repo.listar()).extracting(Skill::ordem).containsExactly(1, 2, 3);
	}
}
