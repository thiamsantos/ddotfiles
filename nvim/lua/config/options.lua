-- Options are automatically loaded before lazy.nvim startup
-- LazyVim defaults: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua

-- Text-only UI: no nerd-font glyphs or emoji. Plugins that read this flag
-- (snacks, lualine, etc.) fall back to ASCII. LazyVim's central icons table
-- is overridden separately in lua/plugins/icons.lua.
vim.g.have_nerd_font = false

local o = vim.o
o.scrolloff = 10
o.confirm = true
o.relativenumber = true

vim.opt.listchars = { tab = ">~", trail = ".", nbsp = "+" }
vim.o.list = true
