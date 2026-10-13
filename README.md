# Frontend

Aplicação web em Next.js. Para executar a aplicação completa, suba primeiro a
API e o PostgreSQL seguindo as instruções do
[`backend/README.md`](../backend/README.md).

## Executar com Docker Compose

No diretório `frontend`, rode:

```sh
docker compose up --build -d
```

A interface estará disponível em <http://localhost:3000>. Por padrão, ela usa
a API em <http://localhost:8081/api>. Se necessário, defina
`NEXT_PUBLIC_API_BASE_URL` em `frontend/.env` antes do build; por ser uma
variável `NEXT_PUBLIC_`, o valor é incluído no bundle durante a compilação da
imagem.

Para entrar com as contas de demonstração criadas pelo backend:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Admin | `admin@sitemaker.local` | `admin12345678` |
| Usuário | `usuario@sitemaker.local` | `usuario123` |

Comandos úteis, executados no diretório `frontend`:

```sh
docker compose logs -f frontend  # acompanhar os logs
docker compose down              # parar o container
```

## Executar localmente para desenvolvimento

Com a API disponível em <http://localhost:8081>, execute:

```sh
npm ci
npm run dev
```

Depois, abra <http://localhost:3000>.
