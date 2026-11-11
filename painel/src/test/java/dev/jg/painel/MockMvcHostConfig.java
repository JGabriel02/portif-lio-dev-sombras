package dev.jg.painel;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;

/** Faz o MockMvc falar com o painel como o navegador faz: Host 127.0.0.1:8080. */
@TestConfiguration
public class MockMvcHostConfig {

	@Bean
	MockMvcBuilderCustomizer hostLoopback() {
		return builder -> builder.defaultRequest(get("/").header("Host", "127.0.0.1:8080"));
	}
}
