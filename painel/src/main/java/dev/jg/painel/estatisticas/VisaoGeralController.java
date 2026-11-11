package dev.jg.painel.estatisticas;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Controller
public class VisaoGeralController {

	private final EstatisticasRepositorio repositorio;

	private final ObjectMapper json;

	public VisaoGeralController(EstatisticasRepositorio repositorio, ObjectMapper json) {
		this.repositorio = repositorio;
		this.json = json;
	}

	@GetMapping("/")
	public String visaoGeral(@RequestParam(name = "periodo", required = false) String valor,
			@RequestHeader(name = "HX-Request", required = false) String htmx, Model model)
			throws JsonProcessingException {
		Periodo periodo = Periodo.de(valor);
		Resumo resumo = repositorio.resumo(periodo);
		List<PontoSerie> serie = repositorio.serie(periodo);
		List<Map<String, Object>> pontos = serie.stream()
				.<Map<String, Object>>map(p -> Map.of("dia", p.dia().toString(), "visitas", p.visitas()))
				.toList();
		model.addAttribute("periodo", periodo);
		model.addAttribute("periodos", Periodo.values());
		model.addAttribute("resumo", resumo);
		model.addAttribute("naoLidas", resumo.naoLidas());
		model.addAttribute("serie", serie);
		model.addAttribute("serieJson", json.writeValueAsString(pontos));
		model.addAttribute("topPaginas", repositorio.topPaginas(periodo, 10));
		model.addAttribute("topOrigens", repositorio.topOrigens(periodo, 10));
		model.addAttribute("topPaises", repositorio.topPaises(periodo, 10));
		model.addAttribute("aparelhos", repositorio.porAparelho(periodo));
		model.addAttribute("idiomas", repositorio.porIdioma(periodo));
		model.addAttribute("ativo", "visao-geral");
		return htmx != null ? "fragmentos/visao-geral-corpo" : "visao-geral";
	}

}
