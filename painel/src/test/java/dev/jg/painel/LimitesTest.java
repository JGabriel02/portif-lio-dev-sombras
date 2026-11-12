package dev.jg.painel;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest
@Import(TestcontainersConfig.class)
class LimitesTest {

	static final String HASH = "a".repeat(64);
	static final String OUTRO = "b".repeat(64);

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	PostgreSQLContainer<?> postgres;

	@BeforeEach
	@AfterEach
	void limpa() {
		jdbc.update("delete from mensagem");
		jdbc.update("delete from visita");
		jdbc.update("delete from evento");
	}

	void mensagem(String hash) {
		jdbc.update("insert into mensagem(nome, email, texto, visitante_hash) values ('Ana', 'a@b.com', 'texto ok', ?)",
				hash);
	}

	@Test
	void cincoMensagensPorVisitantePorDia() {
		for (int i = 0; i < 5; i++) mensagem(HASH);
		assertThatThrownBy(() -> mensagem(HASH)).isInstanceOf(DataAccessException.class)
				.hasMessageContaining("limite de mensagens por visitante");
		mensagem(OUTRO);
		assertThat(jdbc.queryForObject("select count(*) from mensagem", Integer.class)).isEqualTo(6);
	}

	@Test
	void mensagensDeOntemNaoContam() {
		for (int i = 0; i < 5; i++) {
			jdbc.update("insert into mensagem(nome, email, texto, visitante_hash, criado_em) "
					+ "values ('Ana', 'a@b.com', 'texto ok', ?, now() - interval '2 days')", HASH);
		}
		mensagem(HASH);
	}

	@Test
	void limiteGlobalDeMensagens() {
		for (int i = 0; i < 100; i++) mensagem(null);
		assertThatThrownBy(() -> mensagem(null)).hasMessageContaining("limite diário de mensagens");
	}

	@Test
	void emailGiganteRecusado() {
		assertThatThrownBy(() -> jdbc.update(
				"insert into mensagem(nome, email, texto) values ('Ana', ?, 'texto ok')", "a".repeat(250) + "@b.com"))
				.isInstanceOf(DataAccessException.class);
	}

	@Test
	void visitasAcimaDoLimiteSaoDescartadas() {
		jdbc.update("insert into visita(caminho, origem, visitante_hash) "
				+ "select '/pt', 'direto', ? from generate_series(1, 520)", HASH);
		assertThat(jdbc.queryForObject("select count(*) from visita", Integer.class)).isEqualTo(500);
	}

	@Test
	void eventosAcimaDoLimiteSaoDescartados() {
		jdbc.update("insert into evento(tipo, alvo, visitante_hash) "
				+ "select 'repo', 'x', ? from generate_series(1, 310)", HASH);
		assertThat(jdbc.queryForObject("select count(*) from evento", Integer.class)).isEqualTo(300);
	}

	@Test
	void limitesValemParaARoleSite() throws SQLException {
		jdbc.execute("alter role site login password 'teste'");
		try (Connection c = DriverManager.getConnection(postgres.getJdbcUrl(), "site", "teste")) {
			try (PreparedStatement ps = c.prepareStatement(
					"insert into mensagem(nome, email, texto, visitante_hash) values ('Ana', 'a@b.com', 'texto ok', ?)")) {
				ps.setString(1, HASH);
				for (int i = 0; i < 5; i++) ps.executeUpdate();
				assertThatThrownBy(ps::executeUpdate).isInstanceOf(SQLException.class)
						.hasMessageContaining("limite de mensagens por visitante");
			}
		}
	}
}
