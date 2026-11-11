package dev.jg.painel.conteudo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Dados editáveis de uma skill. */
public class SkillForm {

	@NotBlank(message = "Informe o nome.")
	private String nome;
	@Pattern(regexp = "frontend|backend|tools", message = "Escolha frontend, backend ou tools.")
	private String categoria = "backend";
	@Min(value = 0, message = "Use um valor entre 0 e 50.")
	@Max(value = 50, message = "Use um valor entre 0 e 50.")
	private int anos;
	private boolean aprendendo;
	private String linguagemGithub;

	public String getNome() { return nome; }
	public void setNome(String nome) { this.nome = nome; }
	public String getCategoria() { return categoria; }
	public void setCategoria(String categoria) { this.categoria = categoria; }
	public int getAnos() { return anos; }
	public void setAnos(int anos) { this.anos = anos; }
	public boolean isAprendendo() { return aprendendo; }
	public void setAprendendo(boolean aprendendo) { this.aprendendo = aprendendo; }
	public String getLinguagemGithub() { return linguagemGithub; }
	public void setLinguagemGithub(String linguagemGithub) { this.linguagemGithub = linguagemGithub; }
}
