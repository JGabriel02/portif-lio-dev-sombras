package dev.jg.painel.conteudo;

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
class SeedImportadorTest {

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	SeedImportador importador;

	@BeforeEach
	void limpa() {
		jdbc.execute("truncate projeto, skill restart identity");
	}

	private int conta(String tabela) {
		return jdbc.queryForObject("select count(*) from " + tabela, Integer.class);
	}

	@Test
	void importaSeedComBancoVazio() throws Exception {
		importador.run(null);

		assertThat(conta("projeto")).isEqualTo(4);
		assertThat(conta("skill")).isEqualTo(11);
		assertThat(jdbc.queryForObject("select destaque from projeto where slug = 'npc-forge'", Boolean.class))
				.isTrue();
		assertThat(jdbc.queryForObject("select stack[1] from projeto where slug = 'npc-forge'", String.class))
				.isEqualTo("C#");
		assertThat(jdbc.queryForObject("select resumo_pt from projeto where slug = 'npc-forge'", String.class))
				.isNotBlank();
	}

	@Test
	void rodarDuasVezesNaoDuplica() throws Exception {
		importador.run(null);
		importador.run(null);

		assertThat(conta("projeto")).isEqualTo(4);
		assertThat(conta("skill")).isEqualTo(11);
	}

	@Test
	void naoTocaTabelaQueJaTemLinhas() throws Exception {
		jdbc.update("insert into skill(nome, categoria, anos, ordem) values ('Cobol', 'backend', 9, 0)");

		importador.run(null);

		assertThat(conta("skill")).isEqualTo(1);
		assertThat(conta("projeto")).isEqualTo(4);
	}
}
