package dev.jg.painel.estatisticas;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ProjetosEstatController {

	private final EstatisticasRepositorio repositorio;

	public ProjetosEstatController(EstatisticasRepositorio repositorio) {
		this.repositorio = repositorio;
	}

	@GetMapping("/projetos")
	public String projetos(@RequestParam(name = "periodo", required = false) String valor,
			@RequestHeader(name = "HX-Request", required = false) String htmx, Model model) {
		Periodo periodo = Periodo.de(valor);
		model.addAttribute("periodo", periodo);
		model.addAttribute("periodos", Periodo.values());
		model.addAttribute("ranking", repositorio.ranking(periodo));
		model.addAttribute("naoLidas", repositorio.naoLidas());
		model.addAttribute("ativo", "projetos");
		return htmx != null ? "fragmentos/projetos-estat-corpo :: corpo" : "projetos-estat";
	}

}
