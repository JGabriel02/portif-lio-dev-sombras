package dev.jg.painel.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@ControllerAdvice
public class ErroBancoAdvice {

	private static final Logger log = LoggerFactory.getLogger(ErroBancoAdvice.class);

	@ExceptionHandler(DataAccessException.class)
	@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
	public String semBanco(DataAccessException e, HttpServletRequest pedido,
			HttpServletResponse resposta) {
		log.warn("Falha de acesso ao banco: {}: {}", e.getClass().getSimpleName(), e.getMessage());
		if (pedido.getHeader("HX-Request") != null) {
			resposta.setHeader("HX-Retarget", "main");
			resposta.setHeader("HX-Reswap", "innerHTML");
			return "erro-banco :: aviso";
		}
		return "erro-banco";
	}

}
