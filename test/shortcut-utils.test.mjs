import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../index.js", import.meta.url), "utf8");
const context = {
  module: { exports: {} },
  exports: {},
  console,
  document: {},
  window: {},
};

vm.runInNewContext(
  `${source}
globalThis.__shortcutTestApi = {
  parseCombo,
  formatCombo,
  normalizeSearchText,
  shortcutSearchText,
  stripComboFromLabel,
  labelForKbd,
  seedLabelForCombo,
  isComboOnlyLabel,
};`,
  context,
);

const {
  parseCombo,
  formatCombo,
  normalizeSearchText,
  shortcutSearchText,
  stripComboFromLabel,
  labelForKbd,
  seedLabelForCombo,
  isComboOnlyLabel,
} = context.__shortcutTestApi;

test("parseCombo accepts localized modifier names", () => {
  const cases = [
    ["Cmd+G", "Cmd+G"],
    ["Command-G", "Cmd+G"],
    ["⌘G", "Cmd+G"],
    ["⌘⇧G", "Cmd+Shift+G"],
    ["Strg+G", "Ctrl+G"],
    ["Ctrl+Alt+Suppr", "Ctrl+Alt+Delete"],
    ["Commande+Maj+G", "Cmd+Shift+G"],
    ["Comando+Mayus+G", "Cmd+Shift+G"],
    ["Befehl+Umschalt+G", "Cmd+Shift+G"],
    ["Comando+Maiusc+G", "Cmd+Shift+G"],
    ["コマンド+シフト+G", "Cmd+Shift+G"],
    ["命令+選項+Delete", "Cmd+Alt+Delete"],
  ];

  for (const [input, expected] of cases) {
    assert.equal(parseCombo(input), expected, input);
  }
});

test("parseCombo accepts localized key names", () => {
  const cases = [
    ["Cmd+Return", "Cmd+Enter"],
    ["Cmd+Entrée", "Cmd+Enter"],
    ["Cmd+Eingabe", "Cmd+Enter"],
    ["Cmd+Intro", "Cmd+Enter"],
    ["Cmd+Invio", "Cmd+Enter"],
    ["Cmd+Spacebar", "Cmd+Space"],
    ["Cmd+Espace", "Cmd+Space"],
    ["Cmd+Leertaste", "Cmd+Space"],
    ["Cmd+スペース", "Cmd+Space"],
    ["Cmd+Rücktaste", "Cmd+Backspace"],
    ["Cmd+Entf", "Cmd+Delete"],
    ["Cmd+Canc", "Cmd+Delete"],
  ];

  for (const [input, expected] of cases) {
    assert.equal(parseCombo(input), expected, input);
  }
});

test("parseCombo fuzzes localized modifier/key variants", () => {
  const modifierCases = [
    { aliases: ["Cmd", "Command", "Commande", "Befehl", "Comando", "コマンド", "命令", "⌘"], expected: "Cmd" },
    { aliases: ["Ctrl", "Control", "Contrôle", "Strg", "コントロール", "控制", "⌃"], expected: "Ctrl" },
    { aliases: ["Alt", "Option", "Opción", "Opzione", "オプション", "選項", "⌥"], expected: "Alt" },
    { aliases: ["Shift", "Maj", "Mayús", "Umschalt", "Maiusc", "シフト", "⇧"], expected: "Shift" },
  ];
  const keyCases = [
    ["G", "G"],
    ["1", "1"],
    ["Return", "Enter"],
    ["Entrée", "Enter"],
    ["Eingabe", "Enter"],
    ["Spacebar", "Space"],
    ["Leertaste", "Space"],
    ["Suppr", "Delete"],
    ["Entf", "Delete"],
    ["Canc", "Delete"],
  ];

  for (const mod of modifierCases) {
    for (const alias of mod.aliases) {
      for (const [key, expectedKey] of keyCases) {
        for (const separator of ["+", " ", "-", "＋"]) {
          assert.equal(
            parseCombo(`${alias}${separator}${key}`),
            `${mod.expected}+${expectedKey}`,
            `${alias}${separator}${key}`,
          );
        }
      }
    }
  }
});

test("shortcut search matches labels, glyphs, compact combos, and localized queries", () => {
  const state = { overrides: new Map() };
  const def = {
    id: "find-next",
    label: "Find next match",
    defaultCombo: "Cmd+G",
  };
  const text = shortcutSearchText(state, def);

  for (const query of ["find next", "cmd g", "cmd+g", "cmdg", "⌘G", "Command G", "Befehl G"]) {
    assert.ok(text.includes(normalizeSearchText(query)), query);
  }

  state.overrides.set("find-next", { combo: "Cmd+Shift+G" });
  const remapped = shortcutSearchText(state, def);
  for (const query of ["cmd shift g", "⌘⇧G", "Commande Maj G"]) {
    assert.ok(remapped.includes(normalizeSearchText(query)), query);
  }
});

test("kbd discovery strips shortcut glyphs and falls back to seed labels", () => {
  assert.equal(stripComboFromLabel("Search⌘G", "⌘G"), "Search");
  assert.equal(stripComboFromLabel("New chat⌥⌘N", "⌥⌘N"), "New chat");
  assert.equal(stripComboFromLabel("⌘G", "⌘G"), "");
  assert.equal(seedLabelForCombo("⌘G"), "Search");
  assert.equal(seedLabelForCombo("⌥⌘N"), "New chat");
  assert.equal(isComboOnlyLabel("⌘G"), true);
  assert.equal(isComboOnlyLabel("Search"), false);

  const button = {
    tagName: "BUTTON",
    textContent: "New chat⌥⌘N",
    parentElement: null,
    getAttribute(name) {
      return name === "aria-label" ? "" : null;
    },
  };
  const wrapper = {
    tagName: "SPAN",
    textContent: "⌥⌘N",
    parentElement: button,
    getAttribute() {
      return null;
    },
  };
  const kbds = [{ textContent: "⌥" }, { textContent: "⌘" }, { textContent: "N" }];
  assert.equal(labelForKbd(wrapper, kbds, "⌥+⌘+N"), "New chat");
});

test("formatCombo keeps canonical display stable", () => {
  assert.equal(formatCombo("Cmd+Shift+G"), "⌘⇧G");
  assert.equal(formatCombo("Ctrl+Alt+Delete"), "⌃⌥⌦");
});
