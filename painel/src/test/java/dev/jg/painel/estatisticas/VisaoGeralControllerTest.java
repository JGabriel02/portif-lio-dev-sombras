package dev.jg.painel.estatisticas;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(VisaoGeralController.class)
class VisaoGeralControllerTest {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	EstatisticasRepositorio repo;

	@BeforeEach
	void prepara() {
		when(repo.resumo(any())).thenReturn(new Resumo(1234, 56, 7, 8, 9, 3));
		when(repo.serie(any())).thenReturn(List.of(new PontoSerie(LocalDate.parse("2026-11-11"), 5)));
		when(repo.topPaginas(any(), anyInt())).thenReturn(List.of(new Contagem("/", 5)));
		when(repo.topOrigens(any(), anyInt())).thenReturn(List.of());
		when(repo.topPaises(any(), anyInt())).thenReturn(List.of());
		when(repo.porAparelho(any())).thenReturn(List.of());
		when(repo.porIdioma(any())).thenReturn(List.of());
	}

	@Test
	void paginaCompletaMostraResumo() throws Exception {
		mvc.perform(get("/"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("Visitas")))
				.andExpect(content().string(containsString("1234")))
				.andExpect(content().string(containsString("<nav")));
	}

	@Test
	void requisicaoHtmxDevolveSoOFragmento() throws Exception {
		mvc.perform(get("/").param("periodo", "d7").header("HX-Request", "true"))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("Visitas")))
				.andExpect(content().string(not(containsString("<nav"))));
	}

	@Test
	void falhaDeBancoDa503() throws Exception {
		when(repo.resumo(any())).thenThrow(new DataAccessResourceFailureException("fora"));

		mvc.perform(get("/"))
				.andExpect(status().isServiceUnavailable())
				.andExpect(content().string(containsString("Sem conexão com o banco")))
				.andExpect(content().string(containsString("Tentar de novo")));
	}

}
