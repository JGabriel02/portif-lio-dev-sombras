package dev.jg.painel.conteudo;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Date;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Importa o seed.json (gerado a partir do conteúdo do site) para as tabelas
 * vazias. Nunca toca numa tabela que já tem linhas.
 */
@Component
public class SeedImportador implements ApplicationRunner {

	private static final String INSERT_PROJETO = """
			insert into projeto(slug, repo, ordem, destaque, publicado, demo_url, ocultar_demo, stack, imagens,
				resumo_pt, resumo_en, descricao_pt, descricao_en, aprendizados_pt, aprendizados_en,
				fallback_linguagem, fallback_estrelas, fallback_atualizado_em)
			values (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			""";

	private static final String INSERT_SKILL = """
			insert into skill(nome, categoria, anos, aprendendo, linguagem_github, ordem)
			values (?, ?, ?, ?, ?, ?)
			""";

	private final JdbcTemplate jdbc;
	private final TransactionTemplate tx;
	private final ObjectMapper json = new ObjectMapper();

	public SeedImportador(JdbcTemplate jdbc, TransactionTemplate tx) {
		this.jdbc = jdbc;
		this.tx = tx;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		JsonNode seed = ler();
		tx.executeWithoutResult(status -> {
			if (vazia("projeto")) {
				seed.get("projetos").forEach(this::inserirProjeto);
			}
			if (vazia("skill")) {
				seed.get("skills").forEach(this::inserirSkill);
			}
		});
	}

	private JsonNode ler() throws IOException {
		try (InputStream in = new ClassPathResource("seed.json").getInputStream()) {
			return json.readTree(in);
		}
	}

	private boolean vazia(String tabela) {
		return Boolean.TRUE.equals(jdbc.queryForObject("select not exists (select 1 from " + tabela + ")", Boolean.class));
	}

	private void inserirProjeto(JsonNode p) {
		List<String> stack = new ArrayList<>();
		p.get("stack").forEach(s -> stack.add(s.asText()));
		JsonNode fallback = p.get("fallback");
		jdbc.update(INSERT_PROJETO, ps -> {
			ps.setString(1, p.get("slug").asText());
			ps.setString(2, p.get("repo").asText());
			ps.setInt(3, p.get("ordem").asInt());
			ps.setBoolean(4, p.get("destaque").asBoolean());
			ps.setBoolean(5, p.get("publicado").asBoolean());
			ps.setString(6, texto(p.get("demoUrl")));
			ps.setBoolean(7, p.get("ocultarDemo").asBoolean());
			ps.setArray(8, ps.getConnection().createArrayOf("text", stack.toArray()));
			ps.setString(9, p.get("imagens").toString());
			ps.setString(10, p.get("resumo").get("pt").asText());
			ps.setString(11, p.get("resumo").get("en").asText());
			ps.setString(12, p.get("descricao").get("pt").asText());
			ps.setString(13, p.get("descricao").get("en").asText());
			ps.setString(14, p.get("aprendizados").get("pt").asText());
			ps.setString(15, p.get("aprendizados").get("en").asText());
			ps.setString(16, fallback.get("linguagem").asText());
			ps.setInt(17, fallback.get("estrelas").asInt());
			ps.setDate(18, Date.valueOf(fallback.get("atualizadoEm").asText()));
		});
	}

	private void inserirSkill(JsonNode s) {
		jdbc.update(INSERT_SKILL, ps -> {
			ps.setString(1, s.get("nome").asText());
			ps.setString(2, s.get("categoria").asText());
			ps.setInt(3, s.get("anos").asInt());
			ps.setBoolean(4, s.get("aprendendo").asBoolean());
			String linguagem = texto(s.get("linguagemGithub"));
			if (linguagem == null) {
				ps.setNull(5, Types.VARCHAR);
			} else {
				ps.setString(5, linguagem);
			}
			ps.setInt(6, s.get("ordem").asInt());
		});
	}

	private static String texto(JsonNode n) {
		return n == null || n.isNull() ? null : n.asText();
	}
}
