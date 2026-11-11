package dev.jg.painel.conteudo;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import dev.jg.painel.mensagens.MensagemRepositorio;
import jakarta.validation.Valid;

@Controller
public class SkillsConteudoController {

	static final String OK = ProjetosConteudoController.OK;
	static final String SEM_SITE = ProjetosConteudoController.SEM_SITE;
	static final String DUPLICADA = "Já existe uma skill com esse nome.";

	private final SkillRepositorio repositorio;
	private final RevalidacaoCliente revalidacao;
	private final MensagemRepositorio mensagens;

	public SkillsConteudoController(SkillRepositorio repositorio, RevalidacaoCliente revalidacao,
			MensagemRepositorio mensagens) {
		this.repositorio = repositorio;
		this.revalidacao = revalidacao;
		this.mensagens = mensagens;
	}

	@GetMapping("/conteudo/skills")
	public String listar(Model model) {
		return tela(model, new SkillForm(), Map.of(), null, null, Map.of());
	}

	@PostMapping("/conteudo/skills")
	public String criar(@Valid @ModelAttribute("skill") SkillForm form, BindingResult erros, Model model,
			RedirectAttributes flash) {
		if (!erros.hasErrors()) {
			try {
				repositorio.criar(form);
				return gravado(flash);
			} catch (DuplicateKeyException e) {
				erros.rejectValue("nome", "duplicado", DUPLICADA);
			}
		}
		return tela(model, form, mapa(erros), null, null, Map.of());
	}

	@PostMapping("/conteudo/skills/{id}")
	public String atualizar(@PathVariable int id, @Valid @ModelAttribute("skill") SkillForm form,
			BindingResult erros, Model model, RedirectAttributes flash) {
		if (!erros.hasErrors()) {
			try {
				repositorio.atualizar(id, form);
				return gravado(flash);
			} catch (DuplicateKeyException e) {
				erros.rejectValue("nome", "duplicado", DUPLICADA);
			}
		}
		return tela(model, new SkillForm(), Map.of(), id, form, mapa(erros));
	}

	@PostMapping("/conteudo/skills/{id}/apagar")
	public String apagar(@PathVariable int id, RedirectAttributes flash) {
		repositorio.apagar(id);
		return gravado(flash);
	}

	@PostMapping("/conteudo/skills/{id}/mover")
	public String mover(@PathVariable int id, @RequestParam int delta, RedirectAttributes flash) {
		repositorio.mover(id, Integer.signum(delta));
		return gravado(flash);
	}

	private static Map<String, String> mapa(BindingResult erros) {
		Map<String, String> m = new LinkedHashMap<>();
		for (FieldError e : erros.getFieldErrors()) {
			String msg = "typeMismatch".equals(e.getCode()) ? "Informe um número válido." : e.getDefaultMessage();
			m.putIfAbsent(e.getField(), msg);
		}
		return m;
	}

	private String gravado(RedirectAttributes flash) {
		flash.addFlashAttribute("aviso", revalidacao.revalidar() ? OK : SEM_SITE);
		return "redirect:/conteudo/skills";
	}

	private String tela(Model model, SkillForm novo, Map<String, String> errosNovo, Integer editandoId,
			SkillForm edicao, Map<String, String> errosEdicao) {
		model.addAttribute("skills", repositorio.listar());
		model.addAttribute("novo", novo);
		model.addAttribute("errosNovo", errosNovo);
		model.addAttribute("editandoId", editandoId);
		model.addAttribute("edicao", edicao);
		model.addAttribute("errosEdicao", errosEdicao);
		model.addAttribute("naoLidas", mensagens.naoLidas());
		model.addAttribute("ativo", "conteudo-skills");
		return "conteudo/skills";
	}
}
