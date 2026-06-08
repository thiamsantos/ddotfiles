# LazyVim Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the customized kickstart.nvim config in `nvim/` with a LazyVim distribution, carrying over only the customizations LazyVim does not provide.

**Architecture:** LazyVim is imported as a plugin dependency. `init.lua` bootstraps lazy.nvim and loads `lua/config/lazy.lua`, which imports `LazyVim` + official Extras + the local `lua/plugins/*` overrides. All customization lives in small focused override specs under `lua/plugins/` and `lua/config/`. Old kickstart files are deleted. A committed `nvim-backup/` and a feature branch provide rollback.

**Tech Stack:** Neovim 0.12.2, lazy.nvim, LazyVim, fzf-lua (picker), Neogit (git UI), dexter (Elixir LSP), vim-test, dracula, GNU Stow.

**Spec:** `docs/superpowers/specs/2026-06-08-lazyvim-migration-design.md`

**Testing approach:** There is no Lua unit-test harness in this repo. Each task is verified by launching Neovim headless and asserting that the config loads cleanly and the expected plugin/keymap/server is present. The canonical smoke test is:

```bash
nvim --headless "+lua vim.defer_fn(function() print('LOADED_OK') vim.cmd('qa') end, 200)"
```

A clean load prints `LOADED_OK` with no error lines. Because lazy.nvim installs plugins on first launch, the **first** real launch after Task 2 must be interactive (`nvim`) to let plugins install; headless checks come after.

---

## File Structure

**Created:**
- `nvim-backup/` — verbatim copy of the current `nvim/` (committed, never stowed; rollback reference).
- `nvim/lua/config/lazy.lua` — lazy.nvim bootstrap + LazyVim/Extras/plugins import.
- `nvim/lua/config/options.lua` — kept vim options.
- `nvim/lua/config/keymaps.lua` — only keymaps LazyVim lacks (`<leader>fy`, `<leader>fY`).
- `nvim/lua/config/autocmds.lua` — AutoCreateParentDirs + Brewfile filetype.
- `nvim/lua/plugins/colorscheme.lua` — dracula.
- `nvim/lua/plugins/editor.lua` — fzf-lua keymap overrides.
- `nvim/lua/plugins/git.lua` — Neogit.
- `nvim/lua/plugins/elixir.lua` — dexter LSP override.
- `nvim/lua/plugins/lsp.lua` — fish_lsp + sqlls.
- `nvim/lua/plugins/test.lua` — vim-test + `<leader>mt*`.
- `nvim/lua/plugins/misc.lua` — other.nvim + maximize.nvim.

**Modified:**
- `nvim/init.lua` — reduced to `require("config.lazy")`.
- `nvim/.stylua.toml` — unchanged (kept as-is).
- `CLAUDE.md` — Neovim Architecture section rewritten.

**Deleted:**
- `nvim/lua/plugins/{telescope,blink-cmp,conform,lint,mini,which-key,gitsigns,neogit,dracula,indent_line,autopairs}.lua`
- `nvim/lua/custom/plugins/delete_file.lua`
- `nvim/lua/health.lua` (kickstart health check; not used by LazyVim)
- `nvim/lua/plugins/treesitter.lua` (LazyVim owns treesitter)
- `nvim/lua/plugins/lsp.lua` (the old one; replaced by the new focused `lsp.lua`)

---

## Task 1: Backup current config

**Files:**
- Create: `nvim-backup/` (copy of `nvim/`)

- [ ] **Step 1: Confirm on the migration branch**

Run: `git branch --show-current`
Expected: `lazyvim-migration`

If not, run: `git checkout lazyvim-migration`

- [ ] **Step 2: Copy nvim/ to nvim-backup/**

Run:
```bash
cp -R nvim nvim-backup
```

- [ ] **Step 3: Verify the copy is complete**

Run: `diff -r nvim nvim-backup && echo IDENTICAL`
Expected: `IDENTICAL`

- [ ] **Step 4: Commit the backup**

```bash
git add nvim-backup
git commit -m "chore(nvim): snapshot kickstart config to nvim-backup before LazyVim migration"
```

---

## Task 2: Scaffold LazyVim core (init.lua + config/lazy.lua + empty config files)

This replaces the kickstart entrypoint with the LazyVim bootstrap. After this task, the old plugin specs still exist on disk but are no longer loaded, because `init.lua` stops requiring them.

**Files:**
- Modify: `nvim/init.lua`
- Create: `nvim/lua/config/lazy.lua`
- Create: `nvim/lua/config/options.lua`
- Create: `nvim/lua/config/keymaps.lua`
- Create: `nvim/lua/config/autocmds.lua`

- [ ] **Step 1: Move runtime state aside (one-time, manual)**

LazyVim cannot share kickstart's lazy/mason/treesitter state. Run:
```bash
for d in ~/.local/share/nvim ~/.local/state/nvim ~/.cache/nvim; do
  [ -e "$d" ] && mv "$d" "$d.bak" || true
done
echo "state reset done"
```
Expected: `state reset done`. (Reversible: rename `*.bak` back.)

- [ ] **Step 2: Replace `nvim/init.lua`**

Overwrite `nvim/init.lua` with exactly:
```lua
-- bootstrap lazy.nvim, LazyVim and your plugins
require("config.lazy")
```

- [ ] **Step 3: Create `nvim/lua/config/lazy.lua`**

```lua
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out, "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  spec = {
    -- import LazyVim and its plugins
    { "LazyVim/LazyVim", import = "lazyvim.plugins" },
    -- language + tooling extras
    { import = "lazyvim.plugins.extras.lang.elixir" },
    { import = "lazyvim.plugins.extras.lang.rust" },
    { import = "lazyvim.plugins.extras.lang.typescript" },
    { import = "lazyvim.plugins.extras.lang.json" },
    { import = "lazyvim.plugins.extras.lang.yaml" },
    { import = "lazyvim.plugins.extras.lang.docker" },
    { import = "lazyvim.plugins.extras.lang.markdown" },
    -- local overrides
    { import = "plugins" },
  },
  defaults = {
    lazy = false,
    version = false, -- always use the latest git commit
  },
  install = { colorscheme = { "dracula", "tokyonight", "habamax" } },
  checker = { enabled = true, notify = false },
  performance = {
    rtp = {
      disabled_plugins = {
        "gzip",
        "tarPlugin",
        "tohtml",
        "tutor",
        "zipPlugin",
      },
    },
  },
})
```

- [ ] **Step 4: Create empty-but-valid `nvim/lua/config/options.lua`**

```lua
-- Options are automatically loaded before lazy.nvim startup
-- Default LazyVim options: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Custom options are added in Task 7.
```

- [ ] **Step 5: Create empty-but-valid `nvim/lua/config/keymaps.lua`**

```lua
-- Keymaps are automatically loaded on the VeryLazy event
-- Default LazyVim keymaps: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Custom keymaps are added in Task 7.
```

- [ ] **Step 6: Create empty-but-valid `nvim/lua/config/autocmds.lua`**

```lua
-- Autocmds are automatically loaded on the VeryLazy event
-- Default LazyVim autocmds: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
-- Custom autocmds are added in Task 7.
```

- [ ] **Step 7: Delete the old kickstart plugin specs so the `plugins` import is clean**

The `{ import = "plugins" }` line loads every file in `nvim/lua/plugins/`. The old kickstart specs would still be loaded and would conflict (duplicate plugins, old keymaps). Delete them now; the new override files are created in later tasks.
```bash
rm nvim/lua/plugins/telescope.lua \
   nvim/lua/plugins/blink-cmp.lua \
   nvim/lua/plugins/conform.lua \
   nvim/lua/plugins/lint.lua \
   nvim/lua/plugins/mini.lua \
   nvim/lua/plugins/which-key.lua \
   nvim/lua/plugins/gitsigns.lua \
   nvim/lua/plugins/neogit.lua \
   nvim/lua/plugins/dracula.lua \
   nvim/lua/plugins/indent_line.lua \
   nvim/lua/plugins/autopairs.lua \
   nvim/lua/plugins/treesitter.lua \
   nvim/lua/plugins/lsp.lua
rm -rf nvim/lua/custom
rm -f nvim/lua/health.lua
```

- [ ] **Step 8: Re-stow nvim so the symlink points at the new tree**

The symlink already points at `nvim/`, but confirm it resolves. Run:
```bash
readlink ~/.config/nvim 2>/dev/null || ls -ld ~/.config/nvim
```
Expected: path resolves into this repo's `nvim/`. If `~/.config/nvim` is not a symlink to the repo, run `stow --restow --target="$HOME/.config/nvim" nvim` from the repo root.

- [ ] **Step 9: First interactive launch to install plugins**

Run `nvim` (interactively). LazyVim + all extras install. Wait for installs to finish, then `:q`. Watch for red error lines; a healthy install ends at a normal dashboard.

- [ ] **Step 10: Headless smoke test**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() print('LOADED_OK') vim.cmd('qa') end, 500)" 2>&1 | tail -5
```
Expected: `LOADED_OK`, no error lines.

- [ ] **Step 11: Commit**

```bash
git add nvim/init.lua nvim/lua/config nvim/lua/plugins nvim/lua/custom nvim/lua/health.lua
git commit -m "feat(nvim): bootstrap LazyVim and remove kickstart plugin specs"
```

---

## Task 3: Colorscheme (dracula)

**Files:**
- Create: `nvim/lua/plugins/colorscheme.lua`

- [ ] **Step 1: Create `nvim/lua/plugins/colorscheme.lua`**

```lua
return {
  { "Mofiqul/dracula.nvim", lazy = true },
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "dracula",
    },
  },
}
```

- [ ] **Step 2: Headless test — colorscheme is dracula**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() print('CS='..vim.g.colors_name) vim.cmd('qa') end, 500)" 2>&1 | tail -3
```
Expected: `CS=dracula`

- [ ] **Step 3: Commit**

```bash
git add nvim/lua/plugins/colorscheme.lua
git commit -m "feat(nvim): set dracula as LazyVim colorscheme"
```

---

## Task 4: Git UI (Neogit)

**Files:**
- Create: `nvim/lua/plugins/git.lua`

- [ ] **Step 1: Create `nvim/lua/plugins/git.lua`**

```lua
return {
  {
    "NeogitOrg/neogit",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "sindrets/diffview.nvim",
    },
    cmd = "Neogit",
    keys = {
      {
        "<leader>gg",
        function()
          require("neogit").open({ kind = "replace" })
        end,
        desc = "Neogit",
      },
    },
    opts = {
      mappings = {
        popup = {
          ["F"] = "PullPopup",
          ["p"] = "PushPopup",
          ["P"] = false,
        },
      },
    },
  },
}
```

- [ ] **Step 2: Headless test — `<leader>gg` is mapped and Neogit loads**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() local m = vim.fn.maparg(' gg','n') print('GG='..(m ~= '' and 'mapped' or 'MISSING')) vim.cmd('qa') end, 800)" 2>&1 | tail -3
```
Expected: `GG=mapped`

(Note: LazyVim's default `<leader>gg`→lazygit is overridden by this `keys` spec because the lhs matches; lazy.nvim's last-writer wins for the same key. If both appear in which-key, that is acceptable — the Neogit binding takes effect.)

- [ ] **Step 3: Commit**

```bash
git add nvim/lua/plugins/git.lua
git commit -m "feat(nvim): use Neogit for git UI on <leader>gg"
```

---

## Task 5: Picker keymap overrides (fzf-lua)

**Files:**
- Create: `nvim/lua/plugins/editor.lua`

- [ ] **Step 1: Create `nvim/lua/plugins/editor.lua`**

```lua
return {
  {
    "ibhagwan/fzf-lua",
    keys = {
      {
        "<leader><leader>",
        function()
          local fzf = require("fzf-lua")
          -- Prefer git files; fall back to all files outside a git repo.
          if vim.fn.isdirectory(".git") == 1 or vim.fn.systemlist("git rev-parse --is-inside-work-tree 2>/dev/null")[1] == "true" then
            fzf.git_files({ cmd = "git ls-files --exclude-standard --cached --others" })
          else
            fzf.files()
          end
        end,
        desc = "Find files (git-aware)",
      },
      {
        "<leader>ff",
        function()
          require("fzf-lua").files({ cwd = vim.fn.expand("%:p:h") })
        end,
        desc = "Files in current buffer dir",
      },
      {
        "<leader>s.",
        function()
          require("fzf-lua").live_grep({ cwd = vim.fn.expand("%:p:h") })
        end,
        desc = "Live grep in current buffer dir",
      },
    },
  },
}
```

- [ ] **Step 2: Headless test — the three keymaps exist**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() for _,k in ipairs({'  ','ff','s.'}) do local lhs = ' '..k print(k..'='..(vim.fn.maparg(lhs,'n') ~= '' and 'ok' or 'MISSING')) end vim.cmd('qa') end, 800)" 2>&1 | tail -5
```
Expected: three `ok` lines (`  =ok`, `ff=ok`, `s.=ok`).

- [ ] **Step 3: Commit**

```bash
git add nvim/lua/plugins/editor.lua
git commit -m "feat(nvim): fzf-lua keymaps for find-files, browse-dir, grep-in-dir"
```

---

## Task 6: Elixir / dexter LSP override

**Files:**
- Create: `nvim/lua/plugins/elixir.lua`

- [ ] **Step 1: Create `nvim/lua/plugins/elixir.lua`**

This disables the elixir Extra's LSP servers and registers dexter via the Neovim 0.11+/LazyVim `vim.lsp.config` + `nvim-lspconfig` `servers` mechanism. The elixir Extra's treesitter parsers and `mix format` (conform) stay.

```lua
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      -- Turn off the elixir Extra's language servers; we use dexter instead.
      servers = {
        elixirls = { enabled = false },
        nextls = { enabled = false },
        lexical = { enabled = false },
        dexter = {
          -- dexter is installed via mise/brew, not Mason.
          mason = false,
          cmd = { "dexter", "lsp" },
          filetypes = { "elixir", "eelixir", "heex" },
          root_markers = { ".dexter/dexter.db", ".dexter.db", "mix.exs", ".git" },
        },
      },
      setup = {
        -- Register the dexter config name with Neovim's built-in LSP before setup.
        dexter = function(_, opts)
          vim.lsp.config("dexter", {
            cmd = opts.cmd,
            filetypes = opts.filetypes,
            root_markers = opts.root_markers,
          })
          vim.lsp.enable("dexter")
          return true -- prevent lspconfig from also setting it up
        end,
      },
    },
  },
}
```

- [ ] **Step 2: Headless test — config loads and elixirls is disabled**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() local ok = pcall(function() return require('lazyvim.util') end) print('LV='..tostring(ok)) print('LOADED_OK') vim.cmd('qa') end, 800)" 2>&1 | tail -5
```
Expected: `LOADED_OK`, no errors.

- [ ] **Step 3: Functional test — open an Elixir file, dexter attaches (manual, requires a mix project)**

In an Elixir project run `nvim lib/some_module.ex`, then `:LspInfo` (or `:checkhealth lsp`). Expected: `dexter` listed as the attached client, not elixirls. If you are not in a mix project, skip and rely on Step 2.

- [ ] **Step 4: Commit**

```bash
git add nvim/lua/plugins/elixir.lua
git commit -m "feat(nvim): override elixir Extra LSP with dexter"
```

---

## Task 7: Kept options, autocmds, and keymaps

**Files:**
- Modify: `nvim/lua/config/options.lua`
- Modify: `nvim/lua/config/autocmds.lua`
- Modify: `nvim/lua/config/keymaps.lua`

- [ ] **Step 1: Write `nvim/lua/config/options.lua`**

```lua
-- Options are automatically loaded before lazy.nvim startup
-- LazyVim defaults: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua

vim.g.have_nerd_font = true

local o = vim.o
o.scrolloff = 10
o.confirm = true
o.relativenumber = true

vim.opt.listchars = { tab = "» ", trail = "·", nbsp = "␣" }
vim.o.list = true
```

- [ ] **Step 2: Write `nvim/lua/config/autocmds.lua`**

```lua
-- Autocmds are automatically loaded on the VeryLazy event
-- LazyVim defaults: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua

-- Treat Brewfile as Ruby.
vim.filetype.add({
  pattern = {
    ["^Brewfile$"] = "ruby",
  },
})

-- Automatically create parent directories when saving a new file.
vim.api.nvim_create_autocmd("BufWritePre", {
  group = vim.api.nvim_create_augroup("AutoCreateParentDirs", { clear = true }),
  pattern = "*",
  callback = function(ctx)
    local dir = vim.fn.fnamemodify(ctx.file, ":p:h")
    if vim.fn.isdirectory(dir) == 0 then
      vim.fn.mkdir(dir, "p")
    end
  end,
})
```

- [ ] **Step 3: Write `nvim/lua/config/keymaps.lua`**

```lua
-- Keymaps are automatically loaded on the VeryLazy event
-- LazyVim defaults: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua

-- Yank the absolute file path of the current buffer.
vim.keymap.set("n", "<leader>fy", function()
  local path = vim.fn.expand("%:p")
  vim.fn.setreg("+", path)
  vim.notify("Yanked path: " .. path)
end, { desc = "Yank file path to clipboard" })

-- Yank the project-relative file path of the current buffer.
vim.keymap.set("n", "<leader>fY", function()
  local path = vim.fn.expand("%:.")
  vim.fn.setreg("+", path)
  vim.notify("Yanked path: " .. path)
end, { desc = "Yank project file path to clipboard" })
```

- [ ] **Step 4: Headless test — options applied and keymaps exist**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() print('SO='..vim.o.scrolloff) print('NF='..tostring(vim.g.have_nerd_font)) print('FY='..(vim.fn.maparg(' fy','n') ~= '' and 'ok' or 'MISSING')) print('FYY='..(vim.fn.maparg(' fY','n') ~= '' and 'ok' or 'MISSING')) vim.cmd('qa') end, 800)" 2>&1 | tail -6
```
Expected: `SO=10`, `NF=true`, `FY=ok`, `FYY=ok`.

- [ ] **Step 5: Functional test — parent-dir autocmd**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() local p='/tmp/lazyvim_autodir_test/sub/file.txt' vim.cmd('edit '..p) vim.cmd('write') print('EXISTS='..tostring(vim.fn.filereadable(p)==1)) vim.cmd('qa') end, 600)" 2>&1 | tail -3
rm -rf /tmp/lazyvim_autodir_test
```
Expected: `EXISTS=true`

- [ ] **Step 6: Commit**

```bash
git add nvim/lua/config/options.lua nvim/lua/config/autocmds.lua nvim/lua/config/keymaps.lua
git commit -m "feat(nvim): carry over kept options, autocmds, and path-yank keymaps"
```

---

## Task 8: Non-Extra LSP servers (fish_lsp, sqlls)

**Files:**
- Create: `nvim/lua/plugins/lsp.lua`

- [ ] **Step 1: Create `nvim/lua/plugins/lsp.lua`**

```lua
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        fish_lsp = {},
        sqlls = {},
      },
    },
  },
}
```

- [ ] **Step 2: Headless test — config still loads cleanly**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() print('LOADED_OK') vim.cmd('qa') end, 800)" 2>&1 | tail -3
```
Expected: `LOADED_OK`, no errors.

- [ ] **Step 3: Commit**

```bash
git add nvim/lua/plugins/lsp.lua
git commit -m "feat(nvim): add fish_lsp and sqlls language servers"
```

---

## Task 9: Test workflow (vim-test + alternate file + maximize)

**Files:**
- Create: `nvim/lua/plugins/test.lua`
- Create: `nvim/lua/plugins/misc.lua`

- [ ] **Step 1: Create `nvim/lua/plugins/test.lua`**

```lua
return {
  {
    "vim-test/vim-test",
    keys = {
      { "<leader>mtv", ":w | TestFile<CR>", desc = "Test file" },
      { "<leader>mts", ":w | TestNearest<CR>", desc = "Test nearest" },
      { "<leader>mta", ":TestSuite<CR>", desc = "Test suite" },
      { "<leader>mtr", ":TestLast<CR>", desc = "Test last" },
    },
    config = function()
      vim.g["test#strategy"] = "neovim_sticky"
      vim.g["test#neovim#term_position"] = "vert"
      vim.g["test#neovim_sticky#reopen_window"] = 1
    end,
  },
}
```

- [ ] **Step 2: Create `nvim/lua/plugins/misc.lua`**

```lua
return {
  {
    "rgroli/other.nvim",
    cmd = { "Other", "OtherVSplit", "OtherSplit" },
    keys = {
      { "<leader>mtt", ":Other<CR>", desc = "Open alternate file" },
      { "<leader>mtT", ":OtherVSplit<CR>", desc = "Open alternate file (vsplit)" },
    },
    config = function()
      require("other-nvim").setup({
        mappings = { "elixir" },
      })
    end,
  },
  {
    "declancm/maximize.nvim",
    keys = {
      {
        "<leader>wo",
        function()
          require("maximize").toggle()
        end,
        desc = "Maximize window",
      },
    },
    opts = {},
  },
}
```

- [ ] **Step 3: Register which-key groups for `<leader>m` and `<leader>mt`**

Append to `nvim/lua/plugins/misc.lua` (inside the returned table, as a new entry):
```lua
  {
    "folke/which-key.nvim",
    opts = {
      spec = {
        { "<leader>m", group = "local leader" },
        { "<leader>mt", group = "tests" },
      },
    },
  },
```

- [ ] **Step 4: Headless test — test + alternate + maximize keymaps exist**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() for _,k in ipairs({'mtv','mts','mta','mtr','mtt','mtT','wo'}) do print(k..'='..(vim.fn.maparg(' '..k,'n') ~= '' and 'ok' or 'MISSING')) end vim.cmd('qa') end, 800)" 2>&1 | tail -8
```
Expected: seven `ok` lines.

- [ ] **Step 5: Commit**

```bash
git add nvim/lua/plugins/test.lua nvim/lua/plugins/misc.lua
git commit -m "feat(nvim): vim-test, alternate-file, and maximize keymaps under <leader>m"
```

---

## Task 10: Update CLAUDE.md documentation

**Files:**
- Modify: `CLAUDE.md` (Neovim Architecture section)

- [ ] **Step 1: Replace the "Neovim Architecture" section**

Find the section starting `## Neovim Architecture` and replace its body with:

```markdown
## Neovim Architecture

Distribution: [LazyVim](https://www.lazyvim.org) on top of [lazy.nvim](https://github.com/folke/lazy.nvim). `nvim/init.lua` calls `require("config.lazy")`, which imports LazyVim, a set of language Extras, and the local overrides in `nvim/lua/plugins/`.

- `nvim/lua/config/` — `lazy.lua` (bootstrap + Extras imported), `options.lua`, `keymaps.lua`, `autocmds.lua`.
- `nvim/lua/plugins/*.lua` — one focused override spec per concern: `colorscheme` (dracula), `git` (Neogit), `editor` (fzf-lua keymaps), `elixir` (dexter LSP), `lsp` (fish_lsp, sqlls), `test` (vim-test), `misc` (other.nvim, maximize.nvim).
- LSP/formatting/treesitter come from LazyVim + lang Extras. The picker is **fzf-lua** (LazyVim default). Git UI is **Neogit** on `<leader>gg`. Elixir uses **dexter**, registered manually because it is installed via mise/brew, not Mason.

`nvim-backup/` is a committed, never-stowed snapshot of the previous kickstart config, kept for rollback.

Key custom mappings (`<Space>` is leader):

| Key | Action |
|---|---|
| `<leader><leader>` | fzf-lua: git-aware find files |
| `<leader>ff` | fzf-lua: files in current buffer dir |
| `<leader>s.` | fzf-lua: live grep in current buffer dir |
| `<leader>fy` / `<leader>fY` | Yank absolute / project-relative file path |
| `<leader>mtt` | Open alternate file (test ↔ source) |
| `<leader>mtv` / `<leader>mts` / `<leader>mta` / `<leader>mtr` | vim-test: file / nearest / suite / last |
| `<leader>wo` | Maximize window |
| `<leader>gg` | Neogit |

Everything else uses LazyVim defaults (see `:help LazyVim` and which-key).
```

- [ ] **Step 2: Verify no stale references remain**

Run:
```bash
grep -ni "kickstart\|Mason (:Mason)\|telescope" CLAUDE.md
```
Expected: no lines referencing kickstart or describing Telescope as the picker. (A passing mention of Mason for LazyVim-managed servers is fine; remove any claim that all LSPs are Mason-managed.)

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: rewrite Neovim Architecture section for LazyVim"
```

---

## Task 11: Final verification

- [ ] **Step 1: Full headless smoke test**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() print('LOADED_OK') vim.cmd('qa') end, 1000)" 2>&1 | tail -10
```
Expected: `LOADED_OK`, zero error/warning lines.

- [ ] **Step 2: `:checkhealth lazy` and `:LazyHealth` (interactive)**

Launch `nvim`, run `:checkhealth lazy`. Expected: no errors. Run `:Lazy` and confirm all plugins are installed (no failed clones).

- [ ] **Step 3: All custom keymaps present in one pass**

Run:
```bash
nvim --headless "+lua vim.defer_fn(function() local keys={'  ','ff','s.','fy','fY','gg','mtv','mts','mta','mtr','mtt','mtT','wo'} local missing={} for _,k in ipairs(keys) do if vim.fn.maparg(' '..k,'n')=='' then table.insert(missing,k) end end print(#missing==0 and 'ALL_KEYS_OK' or ('MISSING: '..table.concat(missing,','))) vim.cmd('qa') end, 1000)" 2>&1 | tail -3
```
Expected: `ALL_KEYS_OK`

- [ ] **Step 4: Confirm dracula + no leftover kickstart files**

Run:
```bash
ls nvim/lua/plugins/
test ! -d nvim/lua/custom && echo "custom-gone"
test ! -f nvim/lua/health.lua && echo "health-gone"
```
Expected: only the new override files listed; `custom-gone`; `health-gone`.

- [ ] **Step 5: Push the branch (only when the user asks)**

Do not push automatically. When the user requests it:
```bash
git push -u origin lazyvim-migration
```

---

## Notes for the implementer

- **fzf-lua API:** `require("fzf-lua").files{cwd=...}`, `.git_files{}`, `.live_grep{cwd=...}` are stable. If `git_files` errors outside a repo, the `<leader><leader>` wrapper already falls back to `files()`.
- **dexter:** if `:LspInfo` shows no client, confirm `dexter` is on `$PATH` (`which dexter`) — it is provided by mise/brew, outside this plan's scope.
- **Rollback:** `git checkout main` restores the kickstart config; `nvim-backup/` is a ready-to-stow copy; rename `~/.local/share/nvim.bak` etc. back to undo the state reset.
- **which-key opts merge:** LazyVim deep-merges `which-key.nvim` `opts.spec`, so the group entries in `misc.lua` add to (not replace) LazyVim's defaults.
