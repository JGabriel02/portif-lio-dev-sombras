package dev.jg.painel.conteudo;

import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class SkillRepositorio {

	public record Skill(int id, String nome, String categoria, int anos, boolean aprendendo, String linguagemGithub,
			int ordem) {
	}

	private final JdbcTemplate jdbc;

	public SkillRepositorio(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public List<Skill> listar() {
		return jdbc.query("""
				select id, nome, categoria, anos, aprendendo, linguagem_github, ordem
				from skill order by ordem, id
				""",
				(rs, i) -> new Skill(rs.getInt("id"), rs.getString("nome"), rs.getString("categoria"),
						rs.getInt("anos"), rs.getBoolean("aprendendo"), rs.getString("linguagem_github"),
						rs.getInt("ordem")));
	}

	@Transactional
	public void criar(SkillForm f) {
		jdbc.update("""
				insert into skill(nome, categoria, anos, aprendendo, linguagem_github, ordem)
				values (?, ?, ?, ?, ?, (select coalesce(max(ordem), 0) + 1 from skill))
				""", f.getNome().trim(), f.getCategoria(), f.getAnos(), f.isAprendendo(),
				ProjetoForm.nuloSeVazio(f.getLinguagemGithub()));
	}

	@Transactional
	public int atualizar(int id, SkillForm f) {
		return jdbc.update("""
				update skill set nome = ?, categoria = ?, anos = ?, aprendendo = ?, linguagem_github = ?
				where id = ?
				""", f.getNome().trim(), f.getCategoria(), f.getAnos(), f.isAprendendo(),
				ProjetoForm.nuloSeVazio(f.getLinguagemGithub()), id);
	}

	@Transactional
	public void apagar(int id) {
		jdbc.update("delete from skill where id = ?", id);
	}

	/** Troca a posição com o vizinho; nas pontas não faz nada. */
	@Transactional
	public void mover(int id, int delta) {
		List<Skill> lista = new ArrayList<>(listar());
		int i = -1;
		for (int k = 0; k < lista.size(); k++) {
			if (lista.get(k).id() == id) {
				i = k;
			}
		}
		int j = i + delta;
		if (i < 0 || delta == 0 || j < 0 || j >= lista.size()) {
			return;
		}
		// troca na memória e renumera tudo de 1..n (fecha lacunas e desfaz empates)
		Skill movida = lista.get(i);
		lista.set(i, lista.get(j));
		lista.set(j, movida);
		for (int k = 0; k < lista.size(); k++) {
			if (lista.get(k).ordem() != k + 1) {
				jdbc.update("update skill set ordem = ? where id = ?", k + 1, lista.get(k).id());
			}
		}
	}
}
