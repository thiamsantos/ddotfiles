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

-- Doom Emacs' `SPC f D` (`doom/delete-this-file`): delete the file backing the
-- current buffer (with confirmation) and wipe the buffer.
vim.keymap.set("n", "<leader>fD", function()
  local path = vim.fn.expand("%:p")
  if path == "" or vim.fn.filereadable(path) == 0 then
    vim.notify("No file to delete for this buffer", vim.log.levels.WARN)
    return
  end
  if vim.fn.confirm("Delete " .. path .. "?", "&Yes\n&No", 2) ~= 1 then
    return
  end
  local ok, err = pcall(vim.fn.delete, path)
  if not ok or err ~= 0 then
    vim.notify("Failed to delete " .. path .. (err and ": " .. tostring(err) or ""), vim.log.levels.ERROR)
    return
  end
  vim.api.nvim_buf_delete(0, { force = true })
  vim.notify("Deleted " .. path)
end, { desc = "Delete this file" })
