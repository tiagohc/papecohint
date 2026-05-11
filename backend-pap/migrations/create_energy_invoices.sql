-- Energy invoices submitted by users for mission validation
CREATE TABLE IF NOT EXISTS energy_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name_detected VARCHAR(255) DEFAULT NULL,
  kwh DECIMAL(10,2) DEFAULT NULL,
  period_start DATE DEFAULT NULL,
  period_end DATE DEFAULT NULL,
  entity VARCHAR(100) DEFAULT NULL,
  confidence INT NOT NULL DEFAULT 0,
  file_path VARCHAR(512) DEFAULT NULL,
  file_hash VARCHAR(64) NOT NULL,
  status ENUM('pending_confirmation','confirmed','rejected') NOT NULL DEFAULT 'pending_confirmation',
  raw_text MEDIUMTEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP DEFAULT NULL,
  UNIQUE KEY unique_user_hash (user_id, file_hash),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Family member name aliases for invoice name matching
CREATE TABLE IF NOT EXISTS user_aliases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_alias (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add invoice-mission verification fields to missions table
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS verification_type ENUM('photo','invoice_kwh_below','invoice_kwh_reduce','transport_ticket') NOT NULL DEFAULT 'photo',
  ADD COLUMN IF NOT EXISTS target_kwh INT DEFAULT NULL;
