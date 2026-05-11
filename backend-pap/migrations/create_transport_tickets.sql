-- Migration: transport tickets table for AI-verified ticket mission completion
-- Run AFTER create_energy_invoices.sql

CREATE TABLE IF NOT EXISTS transport_tickets (
  id              INT           NOT NULL AUTO_INCREMENT,
  user_id         INT           NOT NULL,
  mission_id      INT           DEFAULT NULL,
  numero_bilhete  VARCHAR(100)  DEFAULT NULL COMMENT 'Ticket number from AI extraction (e.g. I-GRDJ-4R3R-LIEA)',
  file_hash       CHAR(64)      NOT NULL     COMMENT 'SHA-256 of uploaded file for dedup per user',
  empresa         VARCHAR(100)  DEFAULT NULL,
  origem          VARCHAR(100)  DEFAULT NULL,
  destino         VARCHAR(100)  DEFAULT NULL,
  data_viagem     DATE          DEFAULT NULL,
  hora_viagem     TIME          DEFAULT NULL,
  preco           DECIMAL(8,2)  DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Global ticket number uniqueness: nobody can reuse the same ticket
  UNIQUE KEY uq_numero_bilhete (numero_bilhete),

  -- Same user cannot upload the same file twice
  UNIQUE KEY uq_user_file_hash (user_id, file_hash),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add transport_ticket to missions verification_type enum if not present
ALTER TABLE missions
  MODIFY COLUMN verification_type
    ENUM('photo', 'invoice_kwh_below', 'invoice_kwh_reduce', 'transport_ticket')
    DEFAULT 'photo';
