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
