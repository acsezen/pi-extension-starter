# Guia de Criação de Extensões do Pi

Este guia existe para orientar agentes e mantenedores deste starter a criarem extensões do `pi` da forma recomendada pela documentação e pelos exemplos reais do projeto.

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

## Custom Messages

Quando a extensão precisa mostrar mensagens próprias na conversa:

1. Registre um renderer com `pi.registerMessageRenderer(customType, renderer)`
2. Envie mensagens com `pi.sendMessage({ customType, content, display, details })`

Padrão recomendado:

- `customType` constante em `types.ts`
- `details` tipado
- renderer compacto por padrão, expandido só quando necessário

Exemplo canônico: `message-renderer.ts`.

## Estado e Reconstrução

Se o comportamento depende de estado da sessão:

- prefira reconstruir a partir do histórico persistido
- use `session_start` e `session_tree` para reidratação
- persista estado em tool results ou session entries

Exemplo canônico: `todo.ts`.

Boas práticas:

- não confie apenas em variáveis em memória
- não grave arquivos locais para estado lógico da sessão, salvo quando isso fizer parte explícita do produto
- para branching correto, o estado precisa ser derivável do histórico

## UI e Interação

Use `ctx.ui` quando a extensão precisa interagir com o usuário:

- `notify`
- `confirm`
- `select`
- `input`
- `editor`
- `custom`
- `setStatus`
- `setWidget`
- `setFooter`
- `setEditorComponent`

Regras práticas:

- sempre cheque `ctx.hasUI` quando a extensão puder rodar fora do modo interativo
- mantenha o default compacto
- não dependa de UI para fluxos que também precisem funcionar em `print`, `json` ou `rpc`

## Renderização Customizada

Para tools:

- use `renderCall` e `renderResult` quando quiser UX melhor na TUI
- mantenha o colapsado compacto
- use `expanded` para detalhes
- use `isPartial` para progresso streaming
- só use `renderShell: "self"` quando a moldura padrão realmente atrapalhar

Para mensagens:

- prefira `Text` simples quando possível
- use `Box` apenas quando a moldura adicional trouxer valor real

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

## Quando Consultar Qual Exemplo

- Tool mínimo: `hello.ts`
- Custom messages: `message-renderer.ts`
- Registro dinâmico de tools: `dynamic-tools.ts`
- Estado persistente e reconstrução: `todo.ts`
- Dependências próprias: `with-deps/`
- Segurança e bloqueio de tool calls: `permission-gate.ts`, `protected-paths.ts`
- UI interativa: `question.ts`, `questionnaire.ts`, `overlay-test.ts`
- Renderização de tools built-in: `built-in-tool-renderer.ts`, `minimal-mode.ts`

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
