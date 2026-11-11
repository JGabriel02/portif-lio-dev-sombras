package dev.jg.painel.retencao;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

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
class RetencaoTest {

	private static final Instant AGORA = Instant.parse("2026-11-11T12:00:00Z");

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	JdbcClient jdbcClient;

	private Retencao retencao;

	@BeforeEach
	void limpa() {
		jdbc.execute("delete from visita");
		jdbc.execute("delete from evento");
		jdbc.execute("delete from mensagem");
		retencao = new Retencao(jdbcClient, Clock.fixed(AGORA, ZoneOffset.UTC));
	}

	private void visita(Instant quando) {
		jdbc.update("insert into visita(criado_em, caminho, origem, visitante_hash) values (?, '/', 'direto', ?)",
				Timestamp.from(quando), "a".repeat(64));
	}

	private void evento(Instant quando) {
		jdbc.update("insert into evento(criado_em, tipo, visitante_hash) values (?, 'repo', ?)",
				Timestamp.from(quando), "b".repeat(64));
	}

	private int conta(String tabela) {
		return jdbc.queryForObject("select count(*) from " + tabela, Integer.class);
	}

	@Test
	void apagaVisitasEEventosComMaisDeTreze() {
		Instant quatorzeMeses = AGORA.atZone(ZoneOffset.UTC).minusMonths(14).toInstant();
		Instant dozeMeses = AGORA.atZone(ZoneOffset.UTC).minusMonths(12).toInstant();

		visita(quatorzeMeses);
		visita(dozeMeses);
		visita(AGORA);
		evento(quatorzeMeses);
		evento(AGORA);

		int apagadas = retencao.limpar();

		assertThat(apagadas).isEqualTo(2);
		assertThat(conta("visita")).isEqualTo(2);
		assertThat(conta("evento")).isEqualTo(1);
	}

	@Test
	void mensagensAntigasFicamIntactas() {
		Instant quatorzeMeses = AGORA.atZone(ZoneOffset.UTC).minusMonths(14).toInstant();
		jdbc.update("insert into mensagem(criado_em, nome, email, texto) values (?, 'Ana', 'ana@exemplo.com', 'oi')",
				Timestamp.from(quatorzeMeses));

		retencao.limpar();

		assertThat(conta("mensagem")).isEqualTo(1);
	}
}
