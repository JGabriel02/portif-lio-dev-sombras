package dev.jg.painel.mensagens;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public record Mensagem(long id, OffsetDateTime criadoEm, String nome, String email, String texto, boolean lida) {

	private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");

	private static final DateTimeFormatter FORMATO = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

	public String criadoEmFormatado() {
		return FORMATO.format(criadoEm.atZoneSameInstant(SAO_PAULO));
	}

}
