package dev.jg.painel.conteudo;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import dev.jg.painel.conteudo.SkillRepositorio.Skill;
import dev.jg.painel.mensagens.MensagemRepositorio;

@WebMvcTest(SkillsConteudoController.class)
@Import(dev.jg.painel.MockMvcHostConfig.class)
class SkillsConteudoControllerTest {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	SkillRepositorio repo;

	@MockitoBean
	RevalidacaoCliente revalidacao;

	@MockitoBean
	MensagemRepositorio mensagens;

	@BeforeEach
	void prepara() {
		when(mensagens.naoLidas()).thenReturn(0L);
		when(repo.atualizar(eq(7), any())).thenReturn(1);
		when(repo.listar()).thenReturn(List.of(new Skill(7, "Java", "backend", 5, false, "Java", 1),
				new Skill(8, "React", "frontend", 2, true, null, 2)));
	}

	@Test
	void listaComLinhasEAcessibilidade() throws Exception {
		mvc.perform(get("/conteudo/skills"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("id=\"conteudo\"")))
				.andExpect(content().string(containsString("aria-label=\"Subir Java\"")))
				.andExpect(content().string(containsString("aria-label=\"Descer React\"")))
				.andExpect(content().string(containsString("Anos de Java")))
				.andExpect(content().string(containsString("<caption")))
				.andExpect(content().string(containsString("onsubmit=\"return confirm(")));
	}

	@Test
	void criarGravaERevalida() throws Exception {
		when(revalidacao.revalidar()).thenReturn(true);
		mvc.perform(post("/conteudo/skills").param("nome", "Go").param("categoria", "backend").param("anos", "1"))
				.andExpect(redirectedUrl("/conteudo/skills"))
				.andExpect(flash().attribute("aviso", "Site atualizado."));
		verify(repo).criar(any(SkillForm.class));
		verify(revalidacao).revalidar();
	}

	@Test
	void revalidacaoFalhaMostraAviso() throws Exception {
		when(revalidacao.revalidar()).thenReturn(false);
		mvc.perform(post("/conteudo/skills/7").param("nome", "Java").param("categoria", "backend").param("anos", "6"))
				.andExpect(redirectedUrl("/conteudo/skills"))
				.andExpect(flash().attribute("aviso",
						"Salvo, mas o site não respondeu; a mudança aparece em até 1 hora."));
		verify(repo).atualizar(eq(7), any(SkillForm.class));
	}

	@Test
	void atualizarIdInexistenteDa404SemRevalidar() throws Exception {
		mvc.perform(post("/conteudo/skills/999").param("nome", "Go").param("categoria", "backend").param("anos", "1"))
				.andExpect(status().isNotFound());
		verify(revalidacao, never()).revalidar();
	}

	@Test
	void anosNegativosRecusados() throws Exception {
		mvc.perform(post("/conteudo/skills").param("nome", "Go").param("categoria", "backend").param("anos", "-1"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("aria-invalid=\"true\"")));
		verify(repo, never()).criar(any());
		verify(revalidacao, never()).revalidar();
	}

	@Test
	void categoriaInvalidaERecusada() throws Exception {
		mvc.perform(post("/conteudo/skills").param("nome", "Go").param("categoria", "outra").param("anos", "1"))
				.andExpect(status().isOk());
		verify(repo, never()).criar(any());
	}

	@Test
	void nomeDuplicadoVoltaComErro() throws Exception {
		doThrow(new DuplicateKeyException("x")).when(repo).criar(any());
		mvc.perform(post("/conteudo/skills").param("nome", "Java").param("categoria", "backend").param("anos", "1"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("Já existe uma skill com esse nome")));
		verify(revalidacao, never()).revalidar();
	}

	@Test
	void edicaoInvalidaMostraValoresEnviadosNaLinhaEErro() throws Exception {
		mvc.perform(post("/conteudo/skills/7").param("nome", "Java").param("categoria", "backend").param("anos", "99"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("value=\"99\"")))
				.andExpect(content().string(containsString("aria-invalid=\"true\"")));
		verify(repo, never()).atualizar(eq(7), any());
	}

	@Test
	void edicaoComNomeDuplicadoVoltaComErro() throws Exception {
		doThrow(new DuplicateKeyException("x")).when(repo).atualizar(eq(8), any());
		mvc.perform(post("/conteudo/skills/8").param("nome", "Java").param("categoria", "frontend").param("anos", "2"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("Já existe uma skill com esse nome")));
		verify(revalidacao, never()).revalidar();
	}

	@Test
	void moverEApagarRevalidam() throws Exception {
		when(revalidacao.revalidar()).thenReturn(true);
		mvc.perform(post("/conteudo/skills/7/mover").param("delta", "1")).andExpect(redirectedUrl("/conteudo/skills"));
		verify(repo).mover(7, 1);
		mvc.perform(post("/conteudo/skills/7/apagar")).andExpect(redirectedUrl("/conteudo/skills"));
		verify(repo).apagar(7);
		verify(revalidacao, times(2)).revalidar();
	}
}
