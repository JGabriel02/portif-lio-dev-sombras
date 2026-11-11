package dev.jg.painel.mensagens;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import dev.jg.painel.TestcontainersConfig;

@SpringBootTest
@Import(TestcontainersConfig.class)
class MensagemRepositorioTest {

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	MensagemRepositorio repo;

	@BeforeEach
	void limpa() {
		jdbc.execute("delete from mensagem");
	}

	private void insere(int quantas) {
		for (int i = 0; i < quantas; i++) {
			jdbc.update("insert into mensagem (criado_em, nome, email, texto, lida) values (now() - ? * interval '1 minute', ?, ?, ?, ?)",
					i, "Nome " + i, "n" + i + "@exemplo.com", "Texto " + i, i % 5 == 0);
		}
	}

	@Test
	void paginaDeVinteComProxima() {
		insere(25);
		Pagina<Mensagem> p0 = repo.listar(false, 0);
		assertThat(p0.itens()).hasSize(20);
		assertThat(p0.temProxima()).isTrue();
		assertThat(p0.itens().get(0).nome()).isEqualTo("Nome 0");
		Pagina<Mensagem> p1 = repo.listar(false, 1);
		assertThat(p1.itens()).hasSize(5);
		assertThat(p1.temProxima()).isFalse();
		assertThat(p1.pagina()).isEqualTo(1);
	}

	@Test
	void filtraNaoLidas() {
		insere(25);
		Pagina<Mensagem> p = repo.listar(true, 0);
		assertThat(p.itens()).hasSize(20).noneMatch(Mensagem::lida);
		assertThat(p.temProxima()).isFalse();
		assertThat(repo.naoLidas()).isEqualTo(20);
	}

	@Test
	void buscaMarcaEApaga() {
		insere(1);
		jdbc.update("update mensagem set lida = false");
		long id = jdbc.queryForObject("select id from mensagem", Long.class);
		assertThat(repo.buscar(id)).get().extracting(Mensagem::lida).isEqualTo(false);
		repo.marcarLida(id, true);
		assertThat(repo.buscar(id)).get().extracting(Mensagem::lida).isEqualTo(true);
		repo.marcarLida(id, false);
		assertThat(repo.buscar(id)).get().extracting(Mensagem::lida).isEqualTo(false);
		repo.apagar(id);
		assertThat(repo.buscar(id)).isEmpty();
	}

}
