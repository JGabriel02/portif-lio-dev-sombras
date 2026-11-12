package dev.jg.painel.mensagens;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MensagensController.class)
@Import(dev.jg.painel.MockMvcHostConfig.class)
class MensagensControllerTest {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	MensagemRepositorio repo;

	private final Mensagem msg = new Mensagem(1, OffsetDateTime.parse("2026-11-11T15:00:00Z"), "Ana",
			"ana@exemplo.com", "<script>alert(1)</script>", false);

	@BeforeEach
	void prepara() {
		when(repo.naoLidas()).thenReturn(2L);
		when(repo.buscar(1)).thenReturn(Optional.of(msg));
		when(repo.buscar(99)).thenReturn(Optional.empty());
		when(repo.listar(false, 0)).thenReturn(new Pagina<>(List.of(msg), 0, true));
	}

	@Test
	void listaMensagens() throws Exception {
		mvc.perform(get("/mensagens"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("Ana")))
				.andExpect(content().string(containsString("<caption")))
				.andExpect(content().string(containsString("id=\"conteudo\"")))
				.andExpect(content().string(containsString("pagina=1")))
				.andExpect(content().string(containsString("11/11/2026 12:00")));
	}

	@Test
	void abrirMarcaComoLidaEEscapaOTexto() throws Exception {
		mvc.perform(get("/mensagens/1"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("&lt;script&gt;")))
				.andExpect(content().string(not(containsString("<script>alert"))));
		verify(repo).marcarLida(1, true);
	}

	@Test
	void aberturaCrossSiteNaoMarcaComoLida() throws Exception {
		mvc.perform(get("/mensagens/1").header("Sec-Fetch-Site", "cross-site"))
				.andExpect(status().isOk());
		verify(repo, never()).marcarLida(anyLong(), anyBoolean());
	}

	@Test
	void aberturaPeloPainelMarcaComoLida() throws Exception {
		mvc.perform(get("/mensagens/1").header("Sec-Fetch-Site", "same-origin"))
				.andExpect(status().isOk());
		verify(repo).marcarLida(1, true);
	}

	@Test
	void apagarRedireciona() throws Exception {
		mvc.perform(post("/mensagens/1/apagar"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/mensagens"));
		verify(repo).apagar(1);
	}

	@Test
	void marcarNaoLidaRedireciona() throws Exception {
		mvc.perform(post("/mensagens/1/nao-lida"))
				.andExpect(redirectedUrl("/mensagens"));
		verify(repo).marcarLida(1, false);
	}

	@Test
	void idInexistenteDa404() throws Exception {
		mvc.perform(get("/mensagens/99")).andExpect(status().isNotFound());
	}

}
