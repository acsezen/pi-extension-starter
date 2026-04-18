# Guia de Criacao de Extensoes do Pi: Fundamentos

Este guia existe para orientar agentes e mantenedores deste starter a criarem extensoes do `pi` da forma recomendada pela documentacao e pelos exemplos reais do projeto.

## Escopo da serie

Este material foi dividido em 3 arquivos:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## Fontes de verdade

Este documento foi consolidado a partir de:

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/packages.md`
- `packages/coding-agent/examples/extensions/README.md`
- exemplos canonicamente uteis:
  - `packages/coding-agent/examples/extensions/hello.ts`
  - `packages/coding-agent/examples/extensions/todo.ts`
  - `packages/coding-agent/examples/extensions/tools.ts`
  - `packages/coding-agent/examples/extensions/status-line.ts`
  - `packages/coding-agent/examples/extensions/custom-footer.ts`
  - `packages/coding-agent/examples/extensions/model-status.ts`

Quando houver conflito, priorize primeiro `extensions.md` e `packages.md`, depois os exemplos.

## Perfis recomendados

Os exemplos oficiais do `pi` mostram dois perfis comuns:

1. `minimal`
   - extensoes pequenas
   - normalmente um unico tool ou hook
   - inspiracao principal: `hello.ts`

2. `stateful-ui`
   - extensoes com command, configuracao, estado, UI e reidratacao
   - inspiracao principal: `tools.ts`, `todo.ts`, `status-line.ts`, `custom-footer.ts`

Este repositorio usa `stateful-ui` como baseline do starter principal.

## Modelo recomendado

- extensoes do `pi` sao modulos TypeScript carregados diretamente pelo runtime
- o formato recomendado para distribuicao e um pacote npm ou git com manifesto `pi` em `package.json`
- o pacote deve permanecer source-first
- o entrypoint principal deve continuar em `package.json > pi.extensions`

Exemplo minimo:

```json
{
  "name": "my-pi-extension",
  "type": "module",
  "pi": {
    "extensions": ["./src/index.ts"]
  }
}
```

## Estrutura recomendada

Para extensoes pequenas:

```text
src/
  index.ts
```

Para extensoes reais e evolutivas:

```text
src/
  index.ts
  commands/
  state/
  tools/
  ui/
  types.ts
test/
  helpers/
docs/
```

No starter atual, a estrutura recomendada ja aparece de forma concreta:

```text
src/
  index.ts
  commands/settings-command.ts
  state/session-state.ts
  tools/starter-checklist-tool.ts
  ui/footer.ts
  ui/settings-panel.ts
  types.ts
```

Regras praticas:

- `src/index.ts` deve compor o registro da extensao, nao concentrar a logica inteira
- `commands/` para slash commands
- `state/` para reidratacao, persistencia e estado em memoria
- `tools/` para tools reutilizaveis e testaveis
- `ui/` para renderizacao interativa, footer, status e componentes auxiliares
- `types.ts` para ids publicos, defaults e contratos compartilhados
- `test/helpers/` para mocks de `ExtensionAPI`, contexto, `sessionManager` e footer

## Como escrever a extensao

Toda extensao exporta uma funcao default que recebe `ExtensionAPI`.

Padrao recomendado:

```ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function myExtension(pi: ExtensionAPI): void {
  pi.registerCommand("my-settings", {
    description: "Open settings",
    handler: async (_args, ctx) => {
      ctx.ui.notify("ok", "info");
    },
  });
}
```

## Tools

### Padrao preferido

Prefira `defineTool()` para tools declarados fora de `registerTool()`. Isso preserva inferencia de tipos, facilita teste unitario e reutilizacao.

Exemplo de referencia: `hello.ts`.

```ts
import { defineTool } from "@mariozechner/pi-coding-agent";
import { StringEnum } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";

export const myTool = defineTool({
  name: "my_tool",
  label: "My Tool",
  description: "Does something useful",
  parameters: Type.Object({
    action: StringEnum(["list", "add"] as const, {
      description: "Operation to perform",
    }),
    text: Type.Optional(Type.String()),
  }),
  async execute() {
    return {
      content: [{ type: "text", text: "ok" }],
      details: { saved: true },
    };
  },
});
```

### Schemas

- use `@sinclair/typebox` para schemas
- para enums de string, prefira `StringEnum` de `@mariozechner/pi-ai`
- evite unions manuais de literais quando `StringEnum` resolver o caso

## Commands

Padrao recomendado:

- registrar via `pi.registerCommand("nome", { description, handler })`
- manter parsing de `args` explicito
- usar `ctx.ui.custom()` quando precisar de interacao rica
- usar `ctx.ui.notify()` para feedback leve

No starter atual, o command principal abre um `SettingsList` e persiste configuracoes com atualizacao imediata.

## Estado

Use dois canais diferentes, cada um com uma responsabilidade:

1. `pi.appendEntry()`
   - metadados de sessao
   - preferencias do usuario
   - configuracoes que nao dependem do resultado de um tool especifico

2. `details` de tool results
   - estado que precisa seguir corretamente o branch atual
   - dados de renderizacao e reidratacao ligados ao historico da tool

O starter atual usa exatamente essa divisao:

- configuracao da UI em `appendEntry()`
- checklist do tool em `details`
