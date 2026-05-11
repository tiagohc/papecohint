require("dotenv").config();
const db = require("../db");

async function run() {
  // Check if column already exists
  const [cols] = await db.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rewards' AND COLUMN_NAME = 'status'"
  );
  if (cols.length === 0) {
    await db.query(
      "ALTER TABLE rewards ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved'"
    );
    console.log("Migration done: rewards.status column added");
  } else {
    console.log("Column already exists, skipping");
  }
  process.exit(0);
}

run().catch((e) => { console.error(e.message); process.exit(1); });
