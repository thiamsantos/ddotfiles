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
