package dev.jg.painel.conteudo;

import java.sql.Array;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class ProjetoRepositorio {

	public record ProjetoResumo(String slug, String repo, int ordem, boolean destaque, boolean publicado) {
	}

	private static final String INSERT = """
			insert into projeto(slug, repo, ordem, destaque, publicado, demo_url, ocultar_demo, stack, imagens,
				resumo_pt, resumo_en, descricao_pt, descricao_en, aprendizados_pt, aprendizados_en,
				fallback_linguagem, fallback_estrelas, fallback_atualizado_em)
			values (?, ?, (select coalesce(max(ordem), 0) + 1 from projeto), ?, ?, ?, ?, ?, '[]'::jsonb,
				?, ?, ?, ?, ?, ?, ?, ?, ?)
			""";

	private static final String UPDATE = """
			update projeto set repo = ?, destaque = ?, publicado = ?, demo_url = ?, ocultar_demo = ?, stack = ?,
				resumo_pt = ?, resumo_en = ?, descricao_pt = ?, descricao_en = ?, aprendizados_pt = ?, aprendizados_en = ?,
				fallback_linguagem = ?, fallback_estrelas = ?, fallback_atualizado_em = ?, atualizado_em = now()
			where slug = ?
			""";

	private final JdbcTemplate jdbc;

	public ProjetoRepositorio(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public List<ProjetoResumo> listar() {
		return jdbc.query("select slug, repo, ordem, destaque, publicado from projeto order by ordem, slug",
				(rs, i) -> new ProjetoResumo(rs.getString("slug"), rs.getString("repo"), rs.getInt("ordem"),
						rs.getBoolean("destaque"), rs.getBoolean("publicado")));
	}

	public Optional<ProjetoForm> buscar(String slug) {
		return jdbc.query("select * from projeto where slug = ?", (rs, i) -> {
			ProjetoForm f = new ProjetoForm();
			f.setSlug(rs.getString("slug"));
			f.setRepo(rs.getString("repo"));
			f.setDestaque(rs.getBoolean("destaque"));
			f.setPublicado(rs.getBoolean("publicado"));
			f.setDemoUrl(rs.getString("demo_url"));
			f.setOcultarDemo(rs.getBoolean("ocultar_demo"));
			Array stack = rs.getArray("stack");
			if (stack != null) {
				f.setStack(String.join(", ", (String[]) stack.getArray()));
			}
			f.setResumoPt(rs.getString("resumo_pt"));
			f.setResumoEn(rs.getString("resumo_en"));
			f.setDescricaoPt(rs.getString("descricao_pt"));
			f.setDescricaoEn(rs.getString("descricao_en"));
			f.setAprendizadosPt(rs.getString("aprendizados_pt"));
			f.setAprendizadosEn(rs.getString("aprendizados_en"));
			f.setFallbackLinguagem(rs.getString("fallback_linguagem"));
			int estrelas = rs.getInt("fallback_estrelas");
			f.setFallbackEstrelas(rs.wasNull() ? null : estrelas);
			Date data = rs.getDate("fallback_atualizado_em");
			f.setFallbackAtualizadoEm(data == null ? null : data.toLocalDate());
			return f;
		}, slug).stream().findFirst();
	}

	@Transactional
	public void criar(ProjetoForm f) {
		desmarcarDestaque(f, f.getSlug());
		jdbc.update(INSERT, ps -> {
			ps.setString(1, f.getSlug());
			ps.setString(2, f.getRepo());
			ps.setBoolean(3, f.isDestaque());
			ps.setBoolean(4, f.isPublicado());
			texto(ps, 5, ProjetoForm.nuloSeVazio(f.getDemoUrl()));
			ps.setBoolean(6, f.isOcultarDemo());
			ps.setArray(7, ps.getConnection().createArrayOf("text", f.stackLista().toArray()));
			comuns(ps, 8, f);
		});
	}

	@Transactional
	public void atualizar(String slug, ProjetoForm f) {
		desmarcarDestaque(f, slug);
		jdbc.update(UPDATE, ps -> {
			ps.setString(1, f.getRepo());
			ps.setBoolean(2, f.isDestaque());
			ps.setBoolean(3, f.isPublicado());
			texto(ps, 4, ProjetoForm.nuloSeVazio(f.getDemoUrl()));
			ps.setBoolean(5, f.isOcultarDemo());
			ps.setArray(6, ps.getConnection().createArrayOf("text", f.stackLista().toArray()));
			comuns(ps, 7, f); // ocupa 7..15
			ps.setString(16, slug);
		});
	}

	@Transactional
	public void apagar(String slug) {
		jdbc.update("delete from projeto where slug = ?", slug);
	}

	/** Troca a posição com o vizinho; nas pontas não faz nada. */
	@Transactional
	public void mover(String slug, int delta) {
		List<ProjetoResumo> lista = listar();
		int i = -1;
		for (int k = 0; k < lista.size(); k++) {
			if (lista.get(k).slug().equals(slug)) {
				i = k;
			}
		}
		int j = i + delta;
		if (i < 0 || delta == 0 || j < 0 || j >= lista.size()) {
			return;
		}
		// renumera as duas posições (evita empates de ordem)
		jdbc.update("update projeto set ordem = ? where slug = ?", j + 1, lista.get(i).slug());
		jdbc.update("update projeto set ordem = ? where slug = ?", i + 1, lista.get(j).slug());
	}

	private void desmarcarDestaque(ProjetoForm f, String slug) {
		if (f.isDestaque()) {
			jdbc.update("update projeto set destaque = false where destaque and slug <> ?", slug);
		}
	}

	/** Parâmetros resumo_pt .. fallback_atualizado_em (9), a partir de {@code inicio}. */
	private static void comuns(PreparedStatement ps, int inicio, ProjetoForm f) throws SQLException {
		ps.setString(inicio, f.getResumoPt());
		ps.setString(inicio + 1, f.getResumoEn());
		ps.setString(inicio + 2, f.getDescricaoPt());
		ps.setString(inicio + 3, f.getDescricaoEn());
		ps.setString(inicio + 4, f.getAprendizadosPt());
		ps.setString(inicio + 5, f.getAprendizadosEn());
		texto(ps, inicio + 6, ProjetoForm.nuloSeVazio(f.getFallbackLinguagem()));
		if (f.getFallbackEstrelas() == null) {
			ps.setNull(inicio + 7, Types.INTEGER);
		} else {
			ps.setInt(inicio + 7, f.getFallbackEstrelas());
		}
		if (f.getFallbackAtualizadoEm() == null) {
			ps.setNull(inicio + 8, Types.DATE);
		} else {
			ps.setDate(inicio + 8, Date.valueOf(f.getFallbackAtualizadoEm()));
		}
	}

	private static void texto(PreparedStatement ps, int idx, String v) throws SQLException {
		if (v == null) {
			ps.setNull(idx, Types.VARCHAR);
		} else {
			ps.setString(idx, v);
		}
	}
}
