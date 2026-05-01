# Custom Keyboard Shortcuts

Codex++ tweak for discovering, remapping, and disabling Codex desktop keyboard shortcuts.

## Features

- Discovers shortcuts from `aria-keyshortcuts`, `<kbd>` labels, and tooltip text
- Seeds known Codex shortcuts that are not exposed in the DOM
- Lets users remap or disable shortcuts from a dedicated Codex++ settings page
- Searches by action label, shortcut text, compact forms like `cmdg`, and localized modifier names
- Parses common localized modifier/key names from discovered UI text
- Stores per-shortcut overrides in Codex++ tweak storage

## Install

Drop this folder into:

```sh
~/Library/Application Support/codex-plusplus/tweaks/
```

Then reload tweaks from Codex++.

## Test

```sh
node --test test/*.test.mjs
```

## Manifest

Tweak id: `co.bennett.custom-keyboard-shortcuts`
