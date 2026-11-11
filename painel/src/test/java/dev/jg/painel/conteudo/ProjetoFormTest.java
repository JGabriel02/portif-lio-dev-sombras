package dev.jg.painel.conteudo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ProjetoFormTest {

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
