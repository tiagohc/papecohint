-- Increase avatar_url column to hold base64 data URIs (~1-2MB)
-- Run this once on your MySQL database.
ALTER TABLE users MODIFY COLUMN avatar_url MEDIUMTEXT;

