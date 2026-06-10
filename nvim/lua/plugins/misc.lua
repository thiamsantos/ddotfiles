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
      preset = "classic",
      spec = {
        { "<leader>m", group = "local leader" },
        { "<leader>mt", group = "tests" },
      },
    },
  },
  {
    -- dracula does not define a NotifyBackground highlight with a background,
    -- so nvim-notify warns and falls back to #000000. Pin it to dracula's bg.
    "rcarriga/nvim-notify",
    opts = {
      background_colour = "#282A36",
    },
  },
}
