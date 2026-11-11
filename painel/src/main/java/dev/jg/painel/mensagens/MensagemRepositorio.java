package dev.jg.painel.mensagens;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class MensagemRepositorio {

	static final int POR_PAGINA = 20;

	private final JdbcClient jdbc;

	public MensagemRepositorio(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public Pagina<Mensagem> listar(boolean soNaoLidas, int pagina) {
		int atual = Math.max(pagina, 0);
		List<Mensagem> linhas = jdbc.sql("""
				select id, criado_em, nome, email, texto, lida
				from mensagem
				where (:filtrar = false or not lida)
				order by criado_em desc, id desc
				limit :limite offset :deslocamento
				""")
				.param("filtrar", soNaoLidas)
				.param("limite", POR_PAGINA + 1)
				.param("deslocamento", atual * POR_PAGINA)
				.query(MensagemRepositorio::mapeia)
				.list();
		boolean temProxima = linhas.size() > POR_PAGINA;
		return new Pagina<>(temProxima ? linhas.subList(0, POR_PAGINA) : linhas, atual, temProxima);
	}

	public Optional<Mensagem> buscar(long id) {
		return jdbc.sql("select id, criado_em, nome, email, texto, lida from mensagem where id = :id")
				.param("id", id)
				.query(MensagemRepositorio::mapeia)
				.optional();
	}

	public void marcarLida(long id, boolean lida) {
		jdbc.sql("update mensagem set lida = :lida where id = :id").param("lida", lida).param("id", id).update();
	}

	public void apagar(long id) {
		jdbc.sql("delete from mensagem where id = :id").param("id", id).update();
	}

	public long naoLidas() {
		return jdbc.sql("select count(*) from mensagem where not lida").query(Long.class).single();
	}

	private static Mensagem mapeia(ResultSet rs, int n) throws SQLException {
		return new Mensagem(rs.getLong("id"), rs.getObject("criado_em", OffsetDateTime.class),
				rs.getString("nome"), rs.getString("email"), rs.getString("texto"), rs.getBoolean("lida"));
	}

}
