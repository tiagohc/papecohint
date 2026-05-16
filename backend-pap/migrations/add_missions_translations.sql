-- Add English translation columns to missions table
ALTER TABLE missions
  ADD COLUMN title_en VARCHAR(255) NULL AFTER title,
  ADD COLUMN description_en TEXT NULL AFTER description;
