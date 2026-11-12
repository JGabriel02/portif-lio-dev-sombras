// Testa a DATABASE_URL do site (role `site`) sem imprimir a senha.
// Uso (PowerShell):  $env:DATABASE_URL = "postgresql://site:...";  node scripts/testar-db.mjs
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Defina DATABASE_URL neste terminal antes de rodar.')
  process.exit(1)
}

let info
try {
  const u = new URL(url)
  info = {
    protocolo: u.protocol,
    usuario: decodeURIComponent(u.username),
    senha: u.password
      ? `(${decodeURIComponent(u.password).length} caracteres)`
      : '(vazia)',
    host: u.hostname,
    banco: u.pathname.slice(1),
    parametros: [...u.searchParams.keys()].join(', ') || '(nenhum)',
  }
} catch {
  console.error(
    'A URL não é válida. Ela deve começar com postgresql:// (sem jdbc:).',
  )
  process.exit(1)
}
console.log('URL lida:', info)

if (info.protocolo !== 'postgresql:' && info.protocolo !== 'postgres:') {
  console.error('Protocolo errado: use postgresql://, não jdbc:.')
  process.exit(1)
}
if (info.usuario !== 'site') {
  console.warn(
    `Atenção: o usuário é "${info.usuario}". O site deve usar "site".`,
  )
}

try {
  const sql = neon(url)
  const [eu] = await sql.query('select current_user as usuario')
  console.log('Conectou como:', eu.usuario)
  const [p] = await sql.query('select count(*)::int as total from projeto')
  console.log('Projetos visíveis:', p.total)
  console.log(
    'OK: a DATABASE_URL funciona. Cole exatamente esta URL na Vercel e faça Redeploy.',
  )
} catch (e) {
  console.error('Falhou:', e?.message ?? e)
  process.exit(1)
}
