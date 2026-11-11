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
