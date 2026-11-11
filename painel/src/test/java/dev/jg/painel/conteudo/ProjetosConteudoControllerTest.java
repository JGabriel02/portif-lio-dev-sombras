package dev.jg.painel.conteudo;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import dev.jg.painel.conteudo.ProjetoRepositorio.ProjetoResumo;
import dev.jg.painel.mensagens.MensagemRepositorio;

@WebMvcTest(ProjetosConteudoController.class)
@Import(dev.jg.painel.MockMvcHostConfig.class)
class ProjetosConteudoControllerTest {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	ProjetoRepositorio repo;

	@MockitoBean
	RevalidacaoCliente revalidacao;

	@MockitoBean
	MensagemRepositorio mensagens;

	@BeforeEach
	void prepara() {
		when(mensagens.naoLidas()).thenReturn(0L);
		when(repo.listar()).thenReturn(List.of(new ProjetoResumo("alfa", "jg/alfa", 1, true, true)));
		ProjetoForm f = new ProjetoForm();
		f.setSlug("alfa");
		f.setRepo("jg/alfa");
		when(repo.buscar("alfa")).thenReturn(Optional.of(f));
		when(repo.buscar("nada")).thenReturn(Optional.empty());
	}

	@Test
	void listaComBotoesDeMover() throws Exception {
		mvc.perform(get("/conteudo/projetos"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("id=\"conteudo\"")))
				.andExpect(content().string(containsString("aria-label=\"Subir alfa\"")))
				.andExpect(content().string(containsString("aria-label=\"Descer alfa\"")));
	}

	@Test
	void formularioTemAbas() throws Exception {
		mvc.perform(get("/conteudo/projetos/alfa"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("role=\"tablist\"")))
				.andExpect(content().string(containsString("name=\"_publicado\"")));
		mvc.perform(get("/conteudo/projetos/novo")).andExpect(status().isOk());
	}

	@Test
	void slugInexistenteDa404() throws Exception {
		mvc.perform(get("/conteudo/projetos/nada")).andExpect(status().isNotFound());
	}

	@Test
	void postValidoGravaERevalida() throws Exception {
		when(revalidacao.revalidar()).thenReturn(true);
		mvc.perform(post("/conteudo/projetos").param("slug", "novo-um").param("repo", "jg/novo-um"))
				.andExpect(redirectedUrl("/conteudo/projetos"))
				.andExpect(flash().attribute("aviso", "Site atualizado."));
		verify(repo).criar(any(ProjetoForm.class));
		verify(revalidacao).revalidar();
	}

	@Test
	void revalidacaoFalhaMostraAviso() throws Exception {
		when(revalidacao.revalidar()).thenReturn(false);
		mvc.perform(post("/conteudo/projetos/alfa").param("repo", "jg/alfa"))
				.andExpect(redirectedUrl("/conteudo/projetos"))
				.andExpect(flash().attribute("aviso",
						"Salvo, mas o site não respondeu; a mudança aparece em até 1 hora."));
		verify(repo).atualizar(eq("alfa"), any(ProjetoForm.class));
	}

	@Test
	void slugInvalidoVoltaAoFormularioSemGravar() throws Exception {
		mvc.perform(post("/conteudo/projetos").param("slug", "Com Espaço").param("repo", "jg/x"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("aria-invalid=\"true\"")))
				.andExpect(content().string(containsString("letras minúsculas")));
		verify(repo, never()).criar(any());
		verify(revalidacao, never()).revalidar();
	}

	@Test
	void slugDuplicadoVoltaComErro() throws Exception {
		doThrow(new DuplicateKeyException("x")).when(repo).criar(any());
		mvc.perform(post("/conteudo/projetos").param("slug", "alfa").param("repo", "jg/alfa"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("Já existe um projeto")));
		verify(revalidacao, never()).revalidar();
	}

	@Test
	void demoUrlInvalidaRecusadaEVaziaAceita() throws Exception {
		mvc.perform(post("/conteudo/projetos").param("slug", "ok").param("repo", "jg/ok").param("demoUrl", "nao e url"))
				.andExpect(status().isOk());
		when(revalidacao.revalidar()).thenReturn(true);
		mvc.perform(post("/conteudo/projetos").param("slug", "ok").param("repo", "jg/ok").param("demoUrl", ""))
				.andExpect(redirectedUrl("/conteudo/projetos"));
	}

	@Test
	void moverEApagarRevalidam() throws Exception {
		when(revalidacao.revalidar()).thenReturn(true);
		mvc.perform(post("/conteudo/projetos/alfa/mover").param("delta", "-1"))
				.andExpect(redirectedUrl("/conteudo/projetos"));
		verify(repo).mover("alfa", -1);
		mvc.perform(post("/conteudo/projetos/alfa/apagar")).andExpect(redirectedUrl("/conteudo/projetos"));
		verify(repo).apagar("alfa");
	}
}
