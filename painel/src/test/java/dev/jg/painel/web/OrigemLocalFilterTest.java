package dev.jg.painel.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

class OrigemLocalFilterTest {

	@RestController
	static class Alvo {
		@GetMapping("/x")
		ResponseEntity<String> ler() {
			return ResponseEntity.ok("ok");
		}

		@PostMapping("/x")
		ResponseEntity<String> gravar() {
			return ResponseEntity.ok("ok");
		}
	}

	MockMvc mvc;

	@BeforeEach
	void prepara() {
		mvc = MockMvcBuilders.standaloneSetup(new Alvo()).addFilters(new OrigemLocalFilter(8080)).build();
	}

	@Test
	void hostForaDoLoopbackRecusado() throws Exception {
		mvc.perform(get("/x").header("Host", "evil.example:8080")).andExpect(status().isForbidden());
		mvc.perform(get("/x").header("Host", "127.0.0.1:9999")).andExpect(status().isForbidden());
		mvc.perform(get("/x").header("Host", "127.0.0.1")).andExpect(status().isForbidden());
		mvc.perform(get("/x")).andExpect(status().isForbidden());
	}

	@Test
	void hostsDoLoopbackPassam() throws Exception {
		mvc.perform(get("/x").header("Host", "127.0.0.1:8080")).andExpect(status().isOk());
		mvc.perform(get("/x").header("Host", "localhost:8080")).andExpect(status().isOk());
	}

	@Test
	void postEntreSitesRecusado() throws Exception {
		mvc.perform(post("/x").header("Host", "127.0.0.1:8080").header("Sec-Fetch-Site", "cross-site")
				.header("Origin", "https://evil.example")).andExpect(status().isForbidden());
		mvc.perform(post("/x").header("Host", "127.0.0.1:8080").header("Sec-Fetch-Site", "same-site"))
				.andExpect(status().isForbidden());
		// Origin válida não salva um Sec-Fetch-Site hostil
		mvc.perform(post("/x").header("Host", "127.0.0.1:8080").header("Sec-Fetch-Site", "cross-site")
				.header("Origin", "http://127.0.0.1:8080")).andExpect(status().isForbidden());
	}

	@Test
	void postDoProprioPainelPassa() throws Exception {
		mvc.perform(post("/x").header("Host", "127.0.0.1:8080").header("Sec-Fetch-Site", "same-origin")
				.header("Origin", "http://127.0.0.1:8080")).andExpect(status().isOk());
		mvc.perform(post("/x").header("Host", "localhost:8080").header("Sec-Fetch-Site", "none"))
				.andExpect(status().isOk());
	}

	@Test
	void semFetchMetadataOrigemDecide() throws Exception {
		mvc.perform(post("/x").header("Host", "127.0.0.1:8080").header("Origin", "http://localhost:8080"))
				.andExpect(status().isOk());
		mvc.perform(post("/x").header("Host", "127.0.0.1:8080")).andExpect(status().isOk());
		mvc.perform(post("/x").header("Host", "127.0.0.1:8080").header("Origin", "https://evil.example"))
				.andExpect(status().isForbidden());
		mvc.perform(post("/x").header("Host", "127.0.0.1:8080").header("Origin", "null"))
				.andExpect(status().isForbidden());
	}

	@Test
	void getEntreSitesNaoEBloqueado() throws Exception {
		mvc.perform(get("/x").header("Host", "127.0.0.1:8080").header("Sec-Fetch-Site", "cross-site"))
				.andExpect(status().isOk());
	}
}
