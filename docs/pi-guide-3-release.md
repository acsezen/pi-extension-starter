# Guia de Criação de Extensões do Pi: Empacotamento e Validação

Este é o terceiro documento da série:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## Dependências

Regras obrigatórias derivadas de `packages.md`:

- Dependências de runtime vão em `dependencies`
- `devDependencies` não estarão disponíveis no runtime quando o pacote for instalado pelo `pi`
- Pacotes core do `pi` devem ficar em `peerDependencies` com `"*"`:
  - `@mariozechner/pi-ai`
  - `@mariozechner/pi-agent-core`
  - `@mariozechner/pi-coding-agent`
  - `@mariozechner/pi-tui`
  - `@sinclair/typebox`

No starter atual:

- `peerDependencies` definem o contrato esperado com o host
- `devDependencies` fixam versões para desenvolvimento local e testes

## Distribuição como Pi Package

Para publicar como pacote compartilhável:

- inclua `keywords` com `pi-package`
- configure `package.json > pi.extensions`
- mantenha `type: "module"`
- garanta que o tarball contém apenas o necessário

Valide com:

```bash
npm run pack:check
```

Instalação local:

```bash
pi install .
```

Teste rápido sem instalar:

```bash
pi -e ./src/index.ts
```

## Checklist de Implementação

Antes de considerar uma extensão pronta:

1. O pacote expõe `pi.extensions` apontando para `src/index.ts`.
2. O código está modularizado entre `index`, `tools`, `commands` e tipos.
3. Tools usam schema tipado.
4. IDs públicos e tipos de `details` estão centralizados.
5. Estado, se existir, sobrevive corretamente a `session_start`, `tree` e `fork`.
6. Há teste unitário para registro e comportamento principal.
7. `npm run check` passa.
8. O smoke test `pi -e ./src/index.ts` foi ao menos considerado.
9. `npm run pack:check` confirma que o pacote npm está limpo.

## Anti-Padrões

Evite:

- exigir build para o `pi` conseguir rodar a extensão, sem necessidade concreta
- colocar dependências de runtime em `devDependencies`
- guardar estado importante só em variáveis de processo
- misturar parsing pesado e side effects diretamente em `src/index.ts`
- usar nomes de tool ou command temporários em release real
- criar renderer verboso demais no modo colapsado
- depender de UI sem fallback quando o código puder rodar fora do modo interativo
