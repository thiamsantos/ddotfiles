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
