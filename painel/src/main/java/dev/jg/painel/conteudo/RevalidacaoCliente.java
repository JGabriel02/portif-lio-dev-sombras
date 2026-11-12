package dev.jg.painel.conteudo;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Pede ao site que revalide o conteúdo publicado (POST /api/revalidar). */
@Component
public class RevalidacaoCliente {

	private static final Logger log = LoggerFactory.getLogger(RevalidacaoCliente.class);
	private static final Duration TIMEOUT = Duration.ofSeconds(5);

	private final String siteUrl;
	private final String segredo;
	private final HttpClient http = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();

	public RevalidacaoCliente(@Value("${painel.site-url:}") String siteUrl,
			@Value("${painel.revalidate-secret:}") String segredo) {
		this.siteUrl = siteUrl == null ? "" : siteUrl.trim();
		this.segredo = segredo == null ? "" : segredo.trim();
	}

	/** Devolve true só se o site respondeu 2xx. Nunca lança exceção. */
	public boolean revalidar() {
		if (siteUrl.isEmpty() || segredo.isEmpty()) {
			return false;
		}
		if (!destinoSeguro(siteUrl)) {
			log.warn("Revalidação recusada: SITE_URL precisa ser https:// (http só para localhost)");
			return false;
		}
		try {
			String base = siteUrl.endsWith("/") ? siteUrl.substring(0, siteUrl.length() - 1) : siteUrl;
			HttpRequest req = HttpRequest.newBuilder(URI.create(base + "/api/revalidar"))
					.timeout(TIMEOUT)
					.header("Authorization", "Bearer " + segredo)
					.POST(HttpRequest.BodyPublishers.noBody())
					.build();
			int status = http.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
			return status >= 200 && status < 300;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			return false;
		} catch (Exception e) {
			log.warn("Revalidação do site falhou: {}", e.toString());
			return false;
		}
	}

	/** O segredo só sai por https, exceto para o próprio computador (testes e dev). */
	static boolean destinoSeguro(String url) {
		try {
			URI uri = URI.create(url);
			String esquema = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
			String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
			if ("https".equals(esquema)) {
				return !host.isEmpty();
			}
			return "http".equals(esquema) && ("localhost".equals(host) || "127.0.0.1".equals(host));
		} catch (IllegalArgumentException e) {
			return false;
		}
	}
}
