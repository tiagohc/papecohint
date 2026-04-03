const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('mission', 'reward', 'system', 'reminder') NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await connection.execute('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
  await connection.execute('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)');

  console.log('Tabela notifications criada com sucesso!');
  await connection.end();
}

run().catch(console.error);