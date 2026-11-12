package dev.jg.painel.conteudo;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

class RevalidacaoClienteTest {

	private HttpServer servidor;
	private final AtomicInteger status = new AtomicInteger(200);
	private final AtomicInteger chamadas = new AtomicInteger();
	private final AtomicReference<String> auth = new AtomicReference<>();
	private final AtomicReference<String> metodo = new AtomicReference<>();

	@BeforeEach
	void sobe() throws IOException {
		servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		servidor.createContext("/api/revalidar", ex -> {
			chamadas.incrementAndGet();
			auth.set(ex.getRequestHeaders().getFirst("Authorization"));
			metodo.set(ex.getRequestMethod());
			ex.sendResponseHeaders(status.get(), -1);
			ex.close();
		});
		servidor.start();
	}

	@AfterEach
	void para() {
		servidor.stop(0);
	}

	private String url() {
		return "http://127.0.0.1:" + servidor.getAddress().getPort();
	}

	@Test
	void devolveTrueCom200EEnviaBearer() {
		assertThat(new RevalidacaoCliente(url(), "s3").revalidar()).isTrue();
		assertThat(auth.get()).isEqualTo("Bearer s3");
		assertThat(metodo.get()).isEqualTo("POST");
	}

	@Test
	void devolveFalseCom401() {
		status.set(401);
		assertThat(new RevalidacaoCliente(url(), "errado").revalidar()).isFalse();
	}

	@Test
	void configVaziaNaoFazRequest() {
		assertThat(new RevalidacaoCliente("", "s3").revalidar()).isFalse();
		assertThat(new RevalidacaoCliente(url(), "").revalidar()).isFalse();
		assertThat(chamadas.get()).isZero();
	}

	@Test
	void portaFechadaDevolveFalse() throws IOException {
		int porta;
		try (ServerSocket s = new ServerSocket(0)) {
			porta = s.getLocalPort();
		}
		assertThat(new RevalidacaoCliente("http://127.0.0.1:" + porta, "s3").revalidar()).isFalse();
	}

	@Test
	void soAceitaHttpsOuLoopback() {
		org.assertj.core.api.Assertions.assertThat(RevalidacaoCliente.destinoSeguro("https://meu-site.vercel.app")).isTrue();
		org.assertj.core.api.Assertions.assertThat(RevalidacaoCliente.destinoSeguro("http://127.0.0.1:3000")).isTrue();
		org.assertj.core.api.Assertions.assertThat(RevalidacaoCliente.destinoSeguro("http://localhost:3000")).isTrue();
		org.assertj.core.api.Assertions.assertThat(RevalidacaoCliente.destinoSeguro("http://meu-site.vercel.app")).isFalse();
		org.assertj.core.api.Assertions.assertThat(RevalidacaoCliente.destinoSeguro("ftp://x")).isFalse();
		org.assertj.core.api.Assertions.assertThat(RevalidacaoCliente.destinoSeguro("nao e url")).isFalse();
	}

	@Test
	void httpExternoNaoEnviaOSegredo() {
		org.assertj.core.api.Assertions.assertThat(
				new RevalidacaoCliente("http://meu-site.vercel.app", "s3").revalidar()).isFalse();
	}
}
