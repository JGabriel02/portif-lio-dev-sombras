package dev.jg.painel;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest
@Import(TestcontainersConfig.class)
class MigracoesTest {

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	PostgreSQLContainer<?> postgres;

	@BeforeEach
	void zeraSeed() {
		jdbc.update("delete from projeto");
		jdbc.update("delete from skill");
	}

	@AfterEach
	void limpa() {
		jdbc.update("delete from projeto");
		jdbc.update("delete from visita");
	}

	@Test
	void criaAsCincoTabelas() {
		List<String> tabelas = jdbc.queryForList(
				"select table_name from information_schema.tables where table_schema = 'public'", String.class);
		assertThat(tabelas).contains("visita", "evento", "mensagem", "projeto", "skill");
	}

	@Test
	void soUmDestaque() {
		jdbc.update("insert into projeto(slug, repo, ordem, destaque) values ('a', 'r/a', 1, true)");
		assertThatThrownBy(
				() -> jdbc.update("insert into projeto(slug, repo, ordem, destaque) values ('b', 'r/b', 2, true)"))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void roleSitePodeInserirColetaMasNaoLer() throws SQLException {
		jdbc.execute("ALTER ROLE site LOGIN PASSWORD 'teste'");
		jdbc.update("insert into projeto(slug, repo, ordem) values ('c', 'r/c', 1)");
		try (Connection c = DriverManager.getConnection(postgres.getJdbcUrl(), "site", "teste");
				Statement st = c.createStatement()) {
			st.executeUpdate("insert into visita(caminho, origem, visitante_hash) values ('/pt','direto', repeat('a',64))");

			assertThatThrownBy(() -> st.executeQuery("select * from mensagem"))
					.isInstanceOf(SQLException.class)
					.extracting(e -> ((SQLException) e).getSQLState()).isEqualTo("42501");

			st.executeQuery("select * from projeto").close();

			assertThatThrownBy(() -> st.executeUpdate("delete from visita"))
					.isInstanceOf(SQLException.class)
					.extracting(e -> ((SQLException) e).getSQLState()).isEqualTo("42501");
		}
	}
}
