# Guia de Criacao de Extensoes do Pi: Empacotamento e Validacao

Este e o terceiro documento da serie:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## Dependencias

Regras obrigatorias derivadas de `packages.md`:

- dependencias de runtime vao em `dependencies`
- `devDependencies` nao estarao disponiveis quando o pacote for instalado pelo `pi`
- pacotes core do `pi` devem ficar em `peerDependencies` com `"*"`

No starter atual, isso significa:

- `@mariozechner/pi-agent-core`
- `@mariozechner/pi-ai`
- `@mariozechner/pi-coding-agent`
- `@mariozechner/pi-tui`
- `@sinclair/typebox`

Como o codigo usa `StringEnum()`, `@mariozechner/pi-ai` tambem aparece em `devDependencies` para desenvolvimento local e testes.

## Distribuicao como Pi Package

Para publicar como pacote compartilhavel:

- mantenha `keywords` com `pi-package`
- configure `package.json > pi.extensions`
- mantenha `type: "module"`
- inclua apenas o necessario no tarball

Valide com:

```bash
npm run pack:check
```

Teste rapido sem instalar:

```bash
pi -e ./src/index.ts
```

Instalacao local como pacote:

```bash
pi install .
```

## Checklist de implementacao

Antes de considerar uma extensao pronta:

1. O pacote expoe `pi.extensions` apontando para `src/index.ts`.
2. O codigo esta modularizado entre `index`, `commands`, `state`, `tools`, `ui` e `types`.
3. Tools usam schema tipado com `TypeBox` e, quando fizer sentido, `StringEnum`.
4. IDs publicos e contratos compartilhados estao centralizados.
5. Estado de sessao usa `appendEntry()` e estado branch-aware usa `details`.
6. Hooks de `session_start`, `session_tree` e `model_select` foram considerados.
7. Ha teste para registro e comportamento principal.
8. `npm run check` passa.
9. O smoke test `pi -e ./src/index.ts` foi executado ou ao menos tentado.
10. `npm run pack:check` confirma que o pacote npm esta limpo.

## Automacao no GitHub

O starter atual inclui:

- `.github/workflows/validate.yml`
  - roda `npm ci`
  - executa `npm run check`
  - valida pushes e pull requests em `main` e `master`

- `.github/workflows/release.yml`
  - usa `googleapis/release-please-action`
  - abre ou atualiza PRs de release a partir de Conventional Commits
  - quando uma release e criada, faz checkout da tag
  - roda `npm run check`
  - publica no npm com provenance

Arquivos relacionados:

- `release-please-config.json`
- `.release-please-manifest.json`

## Anti-padroes

Evite:

- exigir build so para o `pi` conseguir carregar a extensao
- colocar dependencias de runtime em `devDependencies`
- guardar estado importante apenas em variaveis de processo
- usar `appendEntry()` para tudo, inclusive estado que deveria viver em `details`
- depender de UI sem fallback quando o codigo puder rodar em outros modos
- manter ids temporarios do starter numa release publica

## Entrega

Quando a API publica do starter mudar:

- atualize `README.md`
- atualize `docs/pi-guide-*.md`
- revise `AGENTS.md` para manter a lista de arquivos-base coerente
