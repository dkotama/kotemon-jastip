-- Clean up usage data so tokens can be reused
UPDATE tokens 
SET used_by = NULL, 
    used_at = NULL;

-- Remove all users
DELETE FROM users;
