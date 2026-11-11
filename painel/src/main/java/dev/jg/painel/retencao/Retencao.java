package dev.jg.painel.retencao;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Apaga visitas e eventos com mais de 13 meses. Mensagens nunca são apagadas.
 */
@Component
public class Retencao {

	private static final int MESES = 13;

	private final JdbcClient jdbc;
	private final Clock clock;

	public Retencao(JdbcClient jdbc, Clock clock) {
		this.jdbc = jdbc;
		this.clock = clock;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void aoIniciar() {
		limpar();
	}

	@Scheduled(cron = "0 0 4 * * *", zone = "America/Sao_Paulo")
	public void diariamente() {
		limpar();
	}

	/**
	 * @return total de linhas apagadas de visita e evento
	 */
	public int limpar() {
		Timestamp limite = Timestamp.from(
				ZonedDateTime.now(clock).withZoneSameInstant(ZoneOffset.UTC).minusMonths(MESES).toInstant());
		int visitas = jdbc.sql("delete from visita where criado_em < ?")
				.param(limite)
				.update();
		int eventos = jdbc.sql("delete from evento where criado_em < ?")
				.param(limite)
				.update();
		return visitas + eventos;
	}
}
