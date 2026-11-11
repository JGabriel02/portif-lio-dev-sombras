package dev.jg.painel.conteudo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

class ProjetoFormTest {

	private static final Validator V = Validation.buildDefaultValidatorFactory().getValidator();

	private static ProjetoForm valido() {
		ProjetoForm f = new ProjetoForm();
		f.setSlug("ok");
		f.setRepo("meu-repo.v2_x");
		return f;
	}

	private static Set<String> camposInvalidos(ProjetoForm f) {
		return V.validate(f).stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
	}

	@Test
	void repoSoAceitaONomeNoGithub() {
		assertThat(camposInvalidos(valido())).isEmpty();
		ProjetoForm f = valido();
		f.setRepo("dono/nome");
		assertThat(camposInvalidos(f)).containsExactly("repo");
	}

	@Test
	void demoUrlSoAceitaHttpEHttps() {
		for (String ok : new String[] { "", null, "http://a.io", "https://a.io/x" }) {
			ProjetoForm f = valido();
			f.setDemoUrl(ok);
			assertThat(camposInvalidos(f)).as(String.valueOf(ok)).isEmpty();
		}
		for (String ruim : new String[] { "ftp://x", "javascript:alert(1)", "nao e url" }) {
			ProjetoForm f = valido();
			f.setDemoUrl(ruim);
			assertThat(camposInvalidos(f)).as(ruim).containsExactly("demoUrl");
		}
	}

	@Test
	void stackViraLista() {
		ProjetoForm f = new ProjetoForm();
		f.setStack(" Java, ,Spring ");
		assertThat(f.stackLista()).containsExactly("Java", "Spring");
	}

	@Test
	void stackNulaViraListaVazia() {
		assertThat(new ProjetoForm().stackLista()).isEmpty();
	}

	@Test
	void nuloSeVazio() {
		assertThat(ProjetoForm.nuloSeVazio("  ")).isNull();
		assertThat(ProjetoForm.nuloSeVazio(null)).isNull();
		assertThat(ProjetoForm.nuloSeVazio("x")).isEqualTo("x");
	}
}
