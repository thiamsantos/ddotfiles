--[[
  Main module for the delete-file.nvim plugin.
  This file contains the core logic for deleting the file.
--]]

local M = {}

--- Deletes the file in the current buffer after user confirmation.
--
-- This function ensures that:
-- 1. The buffer is associated with a file.
-- 2. The user confirms the deletion via an input prompt.
-- 3. The file is deleted from the disk.
-- 4. The buffer is then closed without saving.
function M.delete_current_file()
	-- Get the full path of the current file
	local file_path = vim.fn.expand("%:p")
	local file_name = vim.fn.expand("%:t") -- Get just the file name for the prompt

	-- Check if the buffer is associated with a file on disk
	if file_path == "" or file_name == "" then
		vim.notify("Buffer is not associated with a file.", vim.log.levels.WARN)
		return
	end

	-- Ask the user for confirmation
	local confirm = vim.fn.input("Are you sure you want to permanently delete '" .. file_name .. "'? [y/N]: ")

	-- Abort if the user does not explicitly type 'y' or 'Y'
	if string.lower(confirm) ~= "y" then
		vim.notify("File deletion canceled.", vim.log.levels.INFO)
		return
	end

	-- Attempt to delete the file using Lua's os.remove function
	local success, err_msg = os.remove(file_path)

	if success then
		-- If file deletion succeeds, close the current buffer forcefully
		-- The '!' is important to discard any changes and close the buffer
		-- even if the underlying file is now gone.
		vim.cmd("bdelete!")
		vim.notify("Deleted file: " .. file_path, vim.log.levels.INFO)
	else
		-- If file deletion fails, notify the user with the error
		vim.notify("Error deleting file: " .. (err_msg or "Unknown error"), vim.log.levels.ERROR)
	end
end

return M
