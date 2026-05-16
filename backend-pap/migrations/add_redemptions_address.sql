-- Adicionar colunas de morada de entrega à tabela redemptions
ALTER TABLE redemptions ADD COLUMN full_name VARCHAR(255) NULL AFTER points_used;
ALTER TABLE redemptions ADD COLUMN address VARCHAR(500) NULL AFTER full_name;
ALTER TABLE redemptions ADD COLUMN city VARCHAR(100) NULL AFTER address;
ALTER TABLE redemptions ADD COLUMN postal_code VARCHAR(20) NULL AFTER city;
ALTER TABLE redemptions ADD COLUMN phone VARCHAR(30) NULL AFTER postal_code;
ALTER TABLE redemptions ADD COLUMN notes TEXT NULL AFTER phone;
