-- Options are automatically loaded before lazy.nvim startup
-- LazyVim defaults: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua

-- Text-only UI: no nerd-font glyphs or emoji. Plugins that read this flag
-- (snacks, lualine, etc.) fall back to ASCII. LazyVim's central icons table
-- is overridden separately in lua/plugins/icons.lua.
vim.g.have_nerd_font = false

-- Use the native Go TypeScript LSP (tsgo, @typescript/native-preview) instead of
-- vtsls — much faster, especially in monorepos. Preview server; revert to "vtsls"
-- if a needed refactor/code-action is missing.
vim.g.lazyvim_ts_lsp = "tsgo"

local o = vim.o
o.scrolloff = 10
o.confirm = true
o.relativenumber = true

vim.opt.listchars = { tab = ">~", trail = ".", nbsp = "+" }
vim.o.list = true
