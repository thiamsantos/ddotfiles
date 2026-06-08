-- Options are automatically loaded before lazy.nvim startup
-- LazyVim defaults: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua

vim.g.have_nerd_font = true

local o = vim.o
o.scrolloff = 10
o.confirm = true
o.relativenumber = true

vim.opt.listchars = { tab = "» ", trail = "·", nbsp = "␣" }
vim.o.list = true
