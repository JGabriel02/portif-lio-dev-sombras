package dev.jg.painel.estatisticas;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Locale;

public enum Periodo {

	D7(7), D30(30), D90(90), M12(365);

	public static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");

	private final int dias;

	Periodo(int dias) {
		this.dias = dias;
	}

	public int dias() {
		return dias;
	}

	public Instant inicio(Clock clock) {
		return clock.instant().atZone(SAO_PAULO).toLocalDate().minusDays(dias - 1L)
				.atStartOfDay(SAO_PAULO).toInstant();
	}

	public boolean porMes() {
		return this == M12;
	}

	public String valor() {
		return name().toLowerCase(Locale.ROOT);
	}

	public String rotulo() {
		return switch (this) {
			case D7 -> "7 dias";
			case D30 -> "30 dias";
			case D90 -> "90 dias";
			case M12 -> "12 meses";
		};
	}

	public static Periodo de(String valor) {
		if (valor != null) {
			for (Periodo p : values()) {
				if (p.name().equalsIgnoreCase(valor)) {
					return p;
				}
			}
		}
		return D30;
	}

}
