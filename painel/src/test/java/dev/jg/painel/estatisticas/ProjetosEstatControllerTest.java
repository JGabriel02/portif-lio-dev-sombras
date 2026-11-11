package dev.jg.painel.estatisticas;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProjetosEstatController.class)
class ProjetosEstatControllerTest {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	EstatisticasRepositorio repo;

	@BeforeEach
	void prepara() {
		when(repo.ranking(any())).thenReturn(List.of(new RankingProjeto("npc-forge", 12, 3, 2),
				new RankingProjeto("sem-dados", 0, 0, 0)));
		when(repo.naoLidas()).thenReturn(0L);
	}

	@Test
	void listaOsSlugs() throws Exception {
		mvc.perform(get("/projetos"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("npc-forge")))
				.andExpect(content().string(containsString("sem-dados")))
				.andExpect(content().string(containsString("<caption")))
				.andExpect(content().string(containsString("<nav")))
				.andExpect(content().string(containsString("id=\"conteudo\"")));
	}

	@Test
	void htmxDevolveSoOFragmento() throws Exception {
		mvc.perform(get("/projetos").param("periodo", "d7").header("HX-Request", "true"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("npc-forge")))
				.andExpect(content().string(not(containsString("<nav"))));
	}

}
