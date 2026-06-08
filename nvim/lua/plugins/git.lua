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
