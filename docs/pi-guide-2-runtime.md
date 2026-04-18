# Guia de Criacao de Extensoes do Pi: Runtime e UI

Este e o segundo documento da serie:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## Estado e reconstruicao

Se o comportamento depende de estado da sessao:

- prefira reconstruir a partir do historico persistido
- use `session_start` e `session_tree` para reidratacao
- use `model_select` quando a UI ou o comportamento depender do modelo atual
- nao confie apenas em variaveis em memoria

Exemplos canonicos:

- `todo.ts`
- `tools.ts`
- `model-status.ts`

No starter atual:

- `src/state/session-state.ts` reidrata configuracao de sessao a partir de `appendEntry()`
- o mesmo modulo reconstroi o checklist a partir de `details` de `starter_checklist`
- `src/index.ts` reaplica UI em `session_start`, `session_tree` e `model_select`

## `appendEntry()` vs `details`

Essa diferenca precisa ficar explicita em qualquer extensao stateful:

### Use `appendEntry()` quando:

- o dado for metadata de sessao
- a extensao estiver persistindo preferencias do usuario
- o estado nao precisar ser derivado de um resultado de tool especifico

### Use `details` quando:

- o estado precisa acompanhar corretamente `fork`, `tree` e branching do historico
- a renderizacao depende do resultado anterior da tool
- a extensao precisa reconstruir o estado do branch atual lendo tool results

No starter:

- `starter-settings-state` e gravado com `pi.appendEntry()`
- o checklist do `starter_checklist` vive em `details`

## UI interativa

Quando a extensao precisa de um painel focado pelo usuario, o padrao recomendado e:

- `ctx.ui.custom()`
- `SettingsList`
- `getSettingsListTheme()`

Exemplo canonicamente relevante: `tools.ts`.

No starter atual, `src/ui/settings-panel.ts` demonstra:

- titulo e resumo dinamico
- `SettingsList` com busca
- callback de mudanca aplicado imediatamente
- re-render sem depender de hacks no command handler

## Status e footer

O `pi` oferece dois niveis principais para UI persistente:

### `ctx.ui.setStatus()`

Use para um resumo curto e sempre disponivel.

Bom para:

- estado ativo/inativo
- modelo atual
- contadores pequenos

### `ctx.ui.setFooter()`

Use quando a extensao precisa substituir o footer inteiro.

Bom para:

- layout proprio
- combinar dados de `ctx.sessionManager`, `ctx.model` e `footerData`
- mostrar branch git e multiplos status ao mesmo tempo

No starter atual, `src/ui/footer.ts` usa os dois:

- `setStatus()` para o resumo compacto
- `setFooter()` para um footer customizado quando o usuario escolhe esse modo no painel

## Lifecycle minimo recomendado para extensoes stateful-ui

Para extensoes com estado e UI, trate estes hooks como baseline:

1. `session_start`
   - reidrata estado
   - reaplica status/footer/widget/header

2. `session_tree`
   - reidrata estado do branch ativo
   - reaplica a UI derivada desse branch

3. `model_select`
   - sincroniza qualquer UI dependente de modelo
   - em alguns casos, emite notify/status

Esse trio esta presente no starter.

## Renderizacao de tools

Para tools:

- use `renderCall()` e `renderResult()` quando a UX da TUI importar
- mantenha o colapsado curto
- use `expanded` para detalhar listas maiores
- evite renderizadores muito verbosos

No starter:

- `src/tools/starter-checklist-tool.ts` usa `renderCall()` para mostrar acao + argumentos
- `renderResult()` mostra um resumo enxuto e expande a lista quando necessario

## Testes de runtime

Como o `pi` nao expoe um kit oficial de mocks para extensoes, o starter inclui helpers base em `test/helpers/`.

Eles cobrem o que normalmente importa validar:

- registro de command/tool/hooks
- `appendEntry()`
- `ctx.ui.custom()`
- `ctx.ui.setStatus()`
- `ctx.ui.setFooter()`
- `sessionManager.getBranch()`

Se uma extensao real crescer, prefira evoluir esses helpers em vez de reinventar mocks por pacote.
