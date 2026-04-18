# AGENTS

## Objetivo

Este repositório é um starter para criar extensões do `pi` como pacotes npm source-first.

Ao implementar novas funcionalidades aqui, trate os seguintes materiais como fonte de verdade:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`
- `README.md`
- `src/index.ts`
- `src/commands/settings-command.ts`
- `src/state/session-state.ts`
- `src/tools/starter-checklist-tool.ts`
- `src/ui/footer.ts`
- `src/ui/settings-panel.ts`

Os guias `docs/pi-guide-*.md` foram derivados dos materiais oficiais do `pi` em:

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/packages.md`
- `packages/coding-agent/examples/extensions/README.md`

## Regras para criar extensões do pi

- Mantenha o pacote source-first: o entrypoint principal deve continuar em TypeScript e listado em `package.json > pi.extensions`.
- Prefira `defineTool()` para tools reutilizáveis e testáveis.
- Use `@sinclair/typebox` para schemas e `StringEnum` de `@mariozechner/pi-ai` quando houver enum de strings compatível com providers Google.
- Registre comandos com `pi.registerCommand("nome", { ... })`.
- Para mensagens customizadas, use `pi.registerMessageRenderer()` junto de `pi.sendMessage()`.
- Para UI interativa, prefira `ctx.ui.custom()` com `SettingsList` e `getSettingsListTheme()` quando o caso for configuracao ou toggles.
- Reaplique comportamento derivado de estado em `session_start` e `session_tree`, e reaja a mudancas de modelo em `model_select` quando a extensao depender disso.
- Use `ctx.ui.setStatus()` para resumo curto e `ctx.ui.setFooter()` quando precisar substituir o footer inteiro.
- Se a extensão tiver estado que precisa sobreviver a `fork`, `tree` e reconstrução de sessão, persista em `details` de tool results ou em entradas de sessão, não em estado solto de processo apenas.
- Dependências de runtime devem ir em `dependencies`. Dependências core do `pi` devem ficar em `peerDependencies` com `"*"`.
- Não introduza etapa de build obrigatória para o `pi` carregar a extensão, a menos que exista motivo concreto.

## Qualidade

- Após alterações que não sejam somente documentação, rode `npm run check`.
- Para validar o fluxo real da extensão, use também `pi -e ./src/index.ts`.
- Antes de publicar, confirme `npm run pack:check`.

## Entrega

- Atualize `README.md` quando a API pública da extensão mudar.
- Atualize `docs/pi-guide-*.md` quando novas decisões de arquitetura ou padrões do `pi` forem incorporados ao starter.
- Atualize este `AGENTS.md` quando os arquivos-base do starter mudarem.
