package dev.jg.painel.mensagens;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class MensagensController {

	private final MensagemRepositorio repositorio;

	public MensagensController(MensagemRepositorio repositorio) {
		this.repositorio = repositorio;
	}

	@GetMapping("/mensagens")
	public String listar(@RequestParam(name = "naoLidas", defaultValue = "false") boolean soNaoLidas,
			@RequestParam(name = "pagina", defaultValue = "0") int pagina, Model model) {
		model.addAttribute("pagina", repositorio.listar(soNaoLidas, pagina));
		model.addAttribute("soNaoLidas", soNaoLidas);
		return tela(model, "mensagens");
	}

	@GetMapping("/mensagens/{id}")
	public String abrir(@PathVariable long id, Model model,
			@RequestHeader(value = "Sec-Fetch-Site", required = false) String secFetchSite) {
		Mensagem mensagem = repositorio.buscar(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		// Só marca como lida quando a página foi aberta pelo próprio painel (ou digitada);
		// um <img> de outro site chega como cross-site e não muda nada.
		if (secFetchSite == null || "same-origin".equals(secFetchSite) || "none".equals(secFetchSite)) {
			repositorio.marcarLida(id, true);
		}
		model.addAttribute("mensagem", mensagem);
		return tela(model, "mensagem");
	}

	@PostMapping("/mensagens/{id}/nao-lida")
	public String marcarNaoLida(@PathVariable long id, RedirectAttributes flash) {
		repositorio.marcarLida(id, false);
		flash.addFlashAttribute("aviso", "Mensagem marcada como não lida.");
		return "redirect:/mensagens";
	}

	@PostMapping("/mensagens/{id}/apagar")
	public String apagar(@PathVariable long id, RedirectAttributes flash) {
		repositorio.apagar(id);
		flash.addFlashAttribute("aviso", "Mensagem apagada.");
		return "redirect:/mensagens";
	}

	private String tela(Model model, String visao) {
		model.addAttribute("naoLidas", repositorio.naoLidas());
		model.addAttribute("ativo", "mensagens");
		return visao;
	}

}
