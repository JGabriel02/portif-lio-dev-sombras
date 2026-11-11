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

## Configuracao passo a passo (Neon e Vercel)

Faca isto uma unica vez. Nunca coloque senhas, URLs reais ou segredos em arquivos versionados.

1. **Criar o projeto no Neon.** Em neon.tech, crie um projeto Postgres e copie a
   connection string do dono do banco (host, banco, usuario e senha).
2. **Gerar os segredos.** Precisa de dois valores aleatorios (um para
   `REVALIDATE_SECRET`, outro para `COLETA_SEGREDO`) e de uma senha para a role `site`:

   ```
   openssl rand -hex 32
   ```

   Sem `openssl` (PowerShell):

   ```powershell
   -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
   ```

3. **Preencher `painel/.env`** (copie de `painel/.env.example`):

   | Variavel                   | Valor                                                                   |
   | -------------------------- | ----------------------------------------------------------------------- |
   | `PAINEL_DATABASE_URL`      | `jdbc:postgresql://<host>/<db>?sslmode=require` (formato JDBC)          |
   | `PAINEL_DATABASE_USER`     | usuario dono do banco                                                   |
   | `PAINEL_DATABASE_PASSWORD` | senha desse usuario                                                     |
   | `SITE_URL`                 | URL publica do site, com `https://`                                     |
   | `REVALIDATE_SECRET`        | o mesmo valor configurado no site (passo 6)                             |

4. **Subir o painel uma vez** com `painel.cmd` (na raiz). As migrations criam as
   tabelas e a role `site` (somente com as permissoes que o site precisa), e o seed
   importa projetos e skills.
5. **Dar senha e login a role `site`.** No console SQL do Neon:

   ```sql
   ALTER ROLE site LOGIN PASSWORD '<senha gerada>';
   ```

6. **Configurar a Vercel** (Project → Settings → Environment Variables):
   - `DATABASE_URL`: `postgresql://site:<senha>@<host>/<db>?sslmode=require`
     (formato URL do Postgres, usuario `site`, nao o formato JDBC);
   - `COLETA_SEGREDO`: valor aleatorio gerado no passo 2;
   - `REVALIDATE_SECRET`: valor aleatorio gerado no passo 2.

   Depois faca um redeploy para as variaveis valerem.
7. **Conferir o `painel/.env`**: `REVALIDATE_SECRET` igual ao da Vercel e `SITE_URL`
   apontando para o site publicado. Reinicie o painel.

### O que o site faz sem as variaveis

- Sem `DATABASE_URL`: o site usa o conteudo estatico (fallback), o formulario de
  contato fica oculto (so e-mail, LinkedIn e GitHub) e nada e coletado.
- Sem `COLETA_SEGREDO`: a coleta de visitas fica desligada.
- Sem `REVALIDATE_SECRET`: a rota `POST /api/revalidar` recusa pedidos e o cache so
  atualiza pelo tempo de revalidacao.

### Observacoes

- O painel escuta somente em `127.0.0.1` e nao tem autenticacao: nao o exponha na rede.
- `JAVA_HOME` precisa apontar para um JDK 21. O Docker so e necessario para os testes.
- Depois de editar os arquivos `.ts` de conteudo do site (`src/content/`), regenere o
  `seed.json` do painel na raiz do repositorio com `pnpm db:seed-export`.
