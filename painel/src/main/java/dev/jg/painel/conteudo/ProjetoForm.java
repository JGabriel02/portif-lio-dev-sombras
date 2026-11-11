package dev.jg.painel.conteudo;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import org.hibernate.validator.constraints.URL;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Dados editáveis de um projeto. As imagens não passam por aqui. */
public class ProjetoForm {

	@Pattern(regexp = "[a-z0-9-]{1,60}", message = "Use de 1 a 60 caracteres: letras minúsculas, números e hífen.")
	@NotBlank(message = "Informe o slug.")
	private String slug;
	@NotBlank(message = "Informe o repositório.")
	private String repo;
	private String resumoPt;
	private String resumoEn;
	private String descricaoPt;
	private String descricaoEn;
	private String aprendizadosPt;
	private String aprendizadosEn;
	private String stack;
	@URL(message = "Informe uma URL válida, como https://exemplo.com.")
	private String demoUrl;
	private boolean ocultarDemo;
	private boolean destaque;
	private boolean publicado = true;
	private String fallbackLinguagem;
	private Integer fallbackEstrelas;
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	private LocalDate fallbackAtualizadoEm;

	public List<String> stackLista() {
		if (stack == null) {
			return List.of();
		}
		return Arrays.stream(stack.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
	}

	public static String nuloSeVazio(String s) {
		return s == null || s.isBlank() ? null : s;
	}

	public String getSlug() { return slug; }
	public void setSlug(String slug) { this.slug = slug; }
	public String getRepo() { return repo; }
	public void setRepo(String repo) { this.repo = repo; }
	public String getResumoPt() { return resumoPt; }
	public void setResumoPt(String v) { this.resumoPt = v; }
	public String getResumoEn() { return resumoEn; }
	public void setResumoEn(String v) { this.resumoEn = v; }
	public String getDescricaoPt() { return descricaoPt; }
	public void setDescricaoPt(String v) { this.descricaoPt = v; }
	public String getDescricaoEn() { return descricaoEn; }
	public void setDescricaoEn(String v) { this.descricaoEn = v; }
	public String getAprendizadosPt() { return aprendizadosPt; }
	public void setAprendizadosPt(String v) { this.aprendizadosPt = v; }
	public String getAprendizadosEn() { return aprendizadosEn; }
	public void setAprendizadosEn(String v) { this.aprendizadosEn = v; }
	public String getStack() { return stack; }
	public void setStack(String stack) { this.stack = stack; }
	public String getDemoUrl() { return demoUrl; }
	public void setDemoUrl(String demoUrl) { this.demoUrl = demoUrl; }
	public boolean isOcultarDemo() { return ocultarDemo; }
	public void setOcultarDemo(boolean v) { this.ocultarDemo = v; }
	public boolean isDestaque() { return destaque; }
	public void setDestaque(boolean v) { this.destaque = v; }
	public boolean isPublicado() { return publicado; }
	public void setPublicado(boolean v) { this.publicado = v; }
	public String getFallbackLinguagem() { return fallbackLinguagem; }
	public void setFallbackLinguagem(String v) { this.fallbackLinguagem = v; }
	public Integer getFallbackEstrelas() { return fallbackEstrelas; }
	public void setFallbackEstrelas(Integer v) { this.fallbackEstrelas = v; }
	public LocalDate getFallbackAtualizadoEm() { return fallbackAtualizadoEm; }
	public void setFallbackAtualizadoEm(LocalDate v) { this.fallbackAtualizadoEm = v; }
}
