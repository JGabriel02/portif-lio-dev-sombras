package dev.jg.painel.web;

import java.io.IOException;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Defesa contra DNS rebinding e CSRF: o painel só atende pelo loopback e só
 * aceita escrita vinda do próprio painel.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class OrigemLocalFilter extends OncePerRequestFilter {

	private final Set<String> hosts;
	private final Set<String> origens;

	public OrigemLocalFilter(@Value("${server.port:8080}") int porta) {
		this.hosts = Set.of("127.0.0.1:" + porta, "localhost:" + porta);
		this.origens = Set.of("http://127.0.0.1:" + porta, "http://localhost:" + porta);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
			throws ServletException, IOException {
		String host = req.getHeader("Host");
		if (host == null || !hosts.contains(host.toLowerCase())) {
			res.sendError(HttpServletResponse.SC_FORBIDDEN);
			return;
		}
		if (!metodoSeguro(req.getMethod()) && !origemPermitida(req)) {
			res.sendError(HttpServletResponse.SC_FORBIDDEN);
			return;
		}
		chain.doFilter(req, res);
	}

	private static boolean metodoSeguro(String metodo) {
		return "GET".equals(metodo) || "HEAD".equals(metodo);
	}

	private boolean origemPermitida(HttpServletRequest req) {
		String site = req.getHeader("Sec-Fetch-Site");
		if (site != null) {
			return "same-origin".equals(site) || "none".equals(site);
		}
		// Clientes sem Fetch Metadata (curl, navegadores antigos): sem Origin passa.
		String origem = req.getHeader("Origin");
		return origem == null || origens.contains(origem.toLowerCase());
	}
}
