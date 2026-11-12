# Painel

Painel administrativo local (Spring Boot 3.5, Java 21) do portfolio. Escuta apenas em `127.0.0.1:8080`, sem autenticacao, e usa o mesmo banco Neon do site.

## Pre-requisitos

- JDK 21, com `JAVA_HOME` apontando para ele.
- Docker rodando (os testes usam Testcontainers com `postgres:17-alpine`).
- Um arquivo `.env` em `painel/` (copie de `.env.example`) com as 5 variaveis.

## Subir

Na raiz do repositorio, no Windows: `painel.cmd`. Ou, dentro de `painel/`:

```
./mvnw spring-boot:run      # Linux/macOS
mvnw.cmd spring-boot:run    # Windows
```

Depois abra http://127.0.0.1:8080.

## Testes

```
./mvnw verify
```

Ao subir, as migrations (Flyway) criam ou atualizam as tabelas e a role `site`, e o
seed importa projetos e skills nas tabelas vazias.

## Observacoes

- O painel escuta somente em `127.0.0.1` e nao tem autenticacao: nao o exponha na rede.
- O Docker so e necessario para os testes.
- `node scripts/testar-db.mjs` (na raiz, com `DATABASE_URL` no terminal) confere se a
  conexao do site com o banco funciona, sem imprimir a senha.
- Depois de editar os arquivos `.ts` de conteudo do site (`src/content/`), regenere o
  `seed.json` do painel na raiz do repositorio com `corepack pnpm db:seed-export`.
- Se voce apagar ou despublicar TODOS os projetos (ou todas as skills), o site volta a usar os arquivos
  de conteudo, e o painel recria as tabelas vazias a partir do `seed.json` na proxima vez que subir.
