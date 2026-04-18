# Guia de Criação de Extensões do Pi: Runtime e UI

Este é o segundo documento da série:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## Custom Messages

Quando a extensão precisa mostrar mensagens próprias na conversa:

1. Registre um renderer com `pi.registerMessageRenderer(customType, renderer)`.
2. Envie mensagens com `pi.sendMessage({ customType, content, display, details })`.

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

## Quando Consultar Qual Exemplo

- Tool mínimo: `hello.ts`
- Custom messages: `message-renderer.ts`
- Registro dinâmico de tools: `dynamic-tools.ts`
- Estado persistente e reconstrução: `todo.ts`
- Dependências próprias: `with-deps/`
- Segurança e bloqueio de tool calls: `permission-gate.ts`, `protected-paths.ts`
- UI interativa: `question.ts`, `questionnaire.ts`, `overlay-test.ts`
- Renderização de tools built-in: `built-in-tool-renderer.ts`, `minimal-mode.ts`
