/**
 * O formulário de contato fica ativo quando há banco configurado: as mensagens
 * são gravadas no Neon. Sem DATABASE_URL a seção mostra só os links.
 */
export function contatoFormAtivo(): boolean {
  return Boolean(process.env.DATABASE_URL)
}
