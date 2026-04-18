# pi-extension-starter

Starter template para criar extensoes do `pi` como pacotes npm source-first, agora com um perfil base mais proximo de extensoes reais: estado de sessao, UI interativa, hooks de lifecycle e um tool com `details` branch-aware.

## O que este starter demonstra

- `package.json > pi.extensions` apontando para `./src/index.ts`
- `src/state/session-state.ts` com persistencia via `pi.appendEntry()`
- `src/tools/starter-checklist-tool.ts` com `defineTool()` e `details` tipados para reconstruir estado por branch
- `src/commands/settings-command.ts` com `ctx.ui.custom()` + `SettingsList` + `getSettingsListTheme()`
- `src/ui/footer.ts` com `ctx.ui.setStatus()` e `ctx.ui.setFooter()`
- hooks `session_start`, `session_tree` e `model_select`
- helpers de teste em `test/helpers/`
- validacao local com `npm run check`
- release automatizado com `release-please` + publish no npm

## Estrutura atual

```text
src/
  index.ts
  commands/
    settings-command.ts
  state/
    session-state.ts
  tools/
    starter-checklist-tool.ts
  ui/
    footer.ts
    settings-panel.ts
  types.ts
test/
  helpers/
    mock-command-context.ts
    mock-extension-api.ts
    mock-extension-context.ts
    mock-footer-data.ts
  index.test.ts
docs/
  pi-guide-1-base.md
  pi-guide-2-runtime.md
  pi-guide-3-release.md
```

## Comportamento do starter

- Slash command: `/starter-settings`
- Tool name: `starter_checklist`
- Session entry type: `starter-settings-state`

O command abre um painel `SettingsList` para alternar configuracoes persistidas.
O tool mantem um checklist simples e grava o estado em `details`, o que torna a reconstruicao correta em `fork`, `tree` e recarga de sessao.
Os hooks reaplicam status/footer e sincronizam o estado em memoria quando a sessao muda.

## Quick Start

1. Ajuste os metadados do pacote em `package.json`.
2. Renomeie os identificadores publicos em `src/types.ts`.
3. Instale dependencias:

   ```bash
   npm install
   ```

4. Rode a validacao completa:

   ```bash
   npm run check
   ```

5. Rode um smoke test com o runtime real do `pi`:

   ```bash
   pi -e ./src/index.ts
   ```

6. Opcionalmente teste a instalacao local como pacote:

   ```bash
   pi install .
   ```

## Padroes de arquitetura incluidos

### 1. Estado de sessao via `appendEntry()`

`src/state/session-state.ts` persiste preferencias do usuario como:

- modo de workflow
- modo do footer
- notificacoes de troca de modelo

Esses dados sao metadados de sessao. Por isso o starter usa `pi.appendEntry()` e reidrata no `session_start` e no `session_tree`.

### 2. Estado branch-aware via `details`

`src/tools/starter-checklist-tool.ts` devolve `details` estruturados em cada resultado.
O starter usa esse historico para reconstruir o checklist do branch atual, sem depender de estado solto de processo.

### 3. UI interativa oficial

`src/commands/settings-command.ts` abre um painel com:

- `ctx.ui.custom()`
- `SettingsList`
- `getSettingsListTheme()`
- atualizacao imediata ao alternar opcoes

### 4. Lifecycle explicito

`src/index.ts` registra:

- `session_start`
- `session_tree`
- `model_select`

Isso mostra como reaplicar comportamento depois de reload, branch navigation e troca de modelo.

### 5. Status e footer

`src/ui/footer.ts` demonstra:

- `ctx.ui.setStatus()` para status compacto e persistente
- `ctx.ui.setFooter()` para um footer customizado que usa `footerData`

## Testes incluidos

O starter agora inclui mocks reutilizaveis para extensoes do `pi`:

- `test/helpers/mock-extension-api.ts`
- `test/helpers/mock-command-context.ts`
- `test/helpers/mock-extension-context.ts`
- `test/helpers/mock-footer-data.ts`

Eles cobrem o que uma extensao stateful normalmente precisa validar:

- registro de command e tool
- hooks de lifecycle
- `appendEntry()`
- `setStatus()` e `setFooter()`
- painel `SettingsList`

## Fluxo de release

O repositorio inclui dois workflows:

- `validate.yml`: roda `npm run check` em pushes e pull requests
- `release.yml`: usa `release-please` para abrir/atualizar PRs de release e publica no npm quando uma release e criada

Antes de publicar, confirme:

```bash
npm run check
npm run pack:check
```

## Customize antes de publicar

- `package.json`
  - `name`
  - `description`
  - `author`
  - `repository`
  - `bugs`
  - `homepage`
- `src/types.ts`
  - `STARTER_SETTINGS_COMMAND_NAME`
  - `STARTER_TOOL_NAME`
  - `STARTER_SETTINGS_ENTRY_TYPE`
  - defaults de `DEFAULT_STARTER_SESSION_SETTINGS`
- `LICENSE`
  - copyright holder

## Documentacao local

Este starter trata os seguintes arquivos como contrato local de implementacao:

- `AGENTS.md`
- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

Eles foram derivados dos docs e exemplos oficiais do `pi` em:

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/packages.md`
- `packages/coding-agent/examples/extensions/README.md`

## Notas

- O pacote continua source-first. Nao existe build obrigatorio para o `pi` carregar a extensao.
- Dependencias core do `pi` ficam em `peerDependencies` com `"*"`.
- `@mariozechner/pi-ai` aparece no starter porque `StringEnum()` faz parte do padrao recomendado para enums de string.
