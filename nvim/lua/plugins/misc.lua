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
  {
    "folke/which-key.nvim",
    opts = {
      spec = {
        { "<leader>m", group = "local leader" },
        { "<leader>mt", group = "tests" },
      },
    },
  },
}
