package dev.jg.painel.conteudo;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import dev.jg.painel.mensagens.MensagemRepositorio;
import jakarta.validation.Valid;

@Controller
public class ProjetosConteudoController {

	static final String OK = "Site atualizado.";
	static final String SEM_SITE = "Salvo, mas o site não respondeu; a mudança aparece em até 1 hora.";

	private final ProjetoRepositorio repositorio;
	private final RevalidacaoCliente revalidacao;
	private final MensagemRepositorio mensagens;

	public ProjetosConteudoController(ProjetoRepositorio repositorio, RevalidacaoCliente revalidacao,
			MensagemRepositorio mensagens) {
		this.repositorio = repositorio;
		this.revalidacao = revalidacao;
		this.mensagens = mensagens;
	}

	@GetMapping("/conteudo/projetos")
	public String listar(Model model) {
		model.addAttribute("projetos", repositorio.listar());
		return tela(model, "conteudo/projetos");
	}

	@GetMapping("/conteudo/projetos/novo")
	public String novo(Model model) {
		model.addAttribute("projeto", new ProjetoForm());
		model.addAttribute("novo", true);
		return tela(model, "conteudo/projeto-form");
	}

	@PostMapping("/conteudo/projetos")
	public String criar(@Valid @ModelAttribute("projeto") ProjetoForm form, BindingResult erros, Model model,
			RedirectAttributes flash) {
		if (!erros.hasErrors()) {
			try {
				repositorio.criar(form);
				return gravado(flash);
			} catch (DuplicateKeyException e) {
				erros.rejectValue("slug", "duplicado", "Já existe um projeto com esse slug.");
			}
		}
		model.addAttribute("novo", true);
		return tela(model, "conteudo/projeto-form");
	}

	@GetMapping("/conteudo/projetos/{slug}")
	public String editar(@PathVariable String slug, Model model) {
		ProjetoForm form = repositorio.buscar(slug)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		model.addAttribute("projeto", form);
		model.addAttribute("novo", false);
		return tela(model, "conteudo/projeto-form");
	}

	@PostMapping("/conteudo/projetos/{slug}")
	public String atualizar(@PathVariable String slug, @Valid @ModelAttribute("projeto") ProjetoForm form,
			BindingResult erros, Model model, RedirectAttributes flash) {
		form.setSlug(slug); // o slug nunca muda na edição
		if (erros.hasErrors()) {
			model.addAttribute("novo", false);
			return tela(model, "conteudo/projeto-form");
		}
		repositorio.atualizar(slug, form);
		return gravado(flash);
	}

	@PostMapping("/conteudo/projetos/{slug}/apagar")
	public String apagar(@PathVariable String slug, RedirectAttributes flash) {
		repositorio.apagar(slug);
		return gravado(flash);
	}

	@PostMapping("/conteudo/projetos/{slug}/mover")
	public String mover(@PathVariable String slug, @RequestParam int delta, RedirectAttributes flash) {
		repositorio.mover(slug, Integer.signum(delta));
		return gravado(flash);
	}

	private String gravado(RedirectAttributes flash) {
		flash.addFlashAttribute("aviso", revalidacao.revalidar() ? OK : SEM_SITE);
		return "redirect:/conteudo/projetos";
	}

	private String tela(Model model, String visao) {
		model.addAttribute("naoLidas", mensagens.naoLidas());
		model.addAttribute("ativo", "conteudo-projetos");
		return visao;
	}
}
