package dev.jg.painel.mensagens;

import java.util.List;

public record Pagina<T>(List<T> itens, int pagina, boolean temProxima) {
}
