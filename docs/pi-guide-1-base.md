# Guia de Criação de Extensões do Pi: Fundamentos

Este guia existe para orientar agentes e mantenedores deste starter a criarem extensões do `pi` da forma recomendada pela documentação e pelos exemplos reais do projeto.

## Escopo da Série

Este material foi dividido em 3 arquivos para manter a leitura mais direta:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## Fontes de Verdade

Este documento foi consolidado a partir de:

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/packages.md`
- `packages/coding-agent/examples/extensions/README.md`
- Exemplos canônicos:
  - `packages/coding-agent/examples/extensions/hello.ts`
  - `packages/coding-agent/examples/extensions/message-renderer.ts`
  - `packages/coding-agent/examples/extensions/dynamic-tools.ts`
  - `packages/coding-agent/examples/extensions/todo.ts`
  - `packages/coding-agent/examples/extensions/with-deps/package.json`

Quando houver conflito, priorize primeiro os docs oficiais `extensions.md` e `packages.md`, depois os exemplos.

## Modelo Recomendado

- Extensões do `pi` são módulos TypeScript carregados diretamente pelo runtime.
- O formato recomendado para distribuição é um pacote npm ou git com manifesto `pi` em `package.json`.
- O pacote deve ser source-first: o `pi` consegue carregar `.ts` via `jiti`, então não existe necessidade de compilar para `dist/` só para execução normal.
- O entrypoint deve ser exposto em `package.json > pi.extensions`.

Exemplo mínimo de manifesto:

```json
{
  "name": "my-pi-extension",
  "type": "module",
  "pi": {
    "extensions": ["./src/index.ts"]
  }
}
```

## Estrutura Recomendada

Para extensões pequenas:

```text
src/
  index.ts
```

Para extensões reais e evolutivas, prefira:

```text
src/
  index.ts
  commands/
  tools/
  utils/
  types.ts
test/
docs/
```

Regras práticas:

- `src/index.ts` deve apenas compor registros, não concentrar toda a lógica.
- `commands/` para slash commands.
- `tools/` para tools da LLM.
- `types.ts` para ids públicos, tipos de `details` e contratos compartilhados.
- `test/` para validar registro e comportamento.

## Como Escrever a Extensão

Toda extensão exporta uma função default que recebe `ExtensionAPI`.

Padrão recomendado:

```ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { myTool } from "./tools/my-tool.js";

export default function myExtension(pi: ExtensionAPI): void {
  pi.registerTool(myTool);
  pi.registerCommand("my-command", {
    description: "Describe the command",
    handler: async (args, ctx) => {
      ctx.ui.notify(args || "ok", "info");
    },
  });
}
```

## Tools

### Padrão preferido

Prefira `defineTool()` para tools declarados fora de `registerTool()`. Isso preserva inferência de tipos, facilita teste unitário e reutilização.

Exemplo real de referência: `hello.ts`.

```ts
import { defineTool } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export const myTool = defineTool({
  name: "my_tool",
  label: "My Tool",
  description: "Does something useful",
  parameters: Type.Object({
    text: Type.String({ description: "Input text" }),
  }),
  async execute(_toolCallId, params) {
    return {
      content: [{ type: "text", text: params.text }],
      details: { echoed: params.text },
    };
  },
});
```

### Schemas

- Use `@sinclair/typebox` para schemas.
- Para enums de string, prefira `StringEnum` de `@mariozechner/pi-ai` quando isso importar para compatibilidade com providers Google.
- Evite `Type.Union([Type.Literal(...)])` para enums de string quando `StringEnum` resolver.

### `details`

Use `details` para:

- estado persistente do resultado
- dados usados por renderização customizada
- reconstrução de estado após `session_start`, `session_tree` ou `fork`

Não use `details` apenas como dump arbitrário. Estruture e tipifique o contrato.

## Commands

Padrão recomendado:

- Registrar via `pi.registerCommand("nome", { description, handler })`
- Fazer parsing de `args` de forma explícita
- Emitir feedback ao usuário via `ctx.ui.notify()`, `ctx.ui.custom()` ou `pi.sendMessage()`

Exemplo útil de referência:

- `message-renderer.ts` para command que dispara custom message
- `dynamic-tools.ts` para command que altera runtime
