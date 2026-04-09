const db = require("../../db");

async function getPremiumStatus(userId) {
  const [rows] = await db.query(
    `
      SELECT
        user_id,
        status,
        plan,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_end,
        updated_at
      FROM user_premium
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  if (rows.length === 0) {
    return {
      user_id: userId,
      status: "inactive",
      plan: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
      updated_at: null,
    };
  }

  const row = rows[0];

  // Auto-expire: if status is active but period has ended, treat as inactive
  if (row.status === "active" && row.current_period_end) {
    const now = new Date();
    const end = new Date(row.current_period_end);
    if (end < now) {
      row.status = "inactive";
    }
  }

  return row;
}

async function upsertPremiumStatus({
  userId,
  status,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  currentPeriodEnd,
}) {
  await db.query(
    `
      INSERT INTO user_premium (
        user_id,
        status,
        plan,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_end,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        plan = VALUES(plan),
        stripe_customer_id = VALUES(stripe_customer_id),
        stripe_subscription_id = VALUES(stripe_subscription_id),
        current_period_end = VALUES(current_period_end),
        updated_at = NOW()
    `,
    [
      userId,
      status,
      plan || null,
      stripeCustomerId || null,
      stripeSubscriptionId || null,
      currentPeriodEnd || null,
    ]
  );
}

async function insertPaymentTransaction({
  userId,
  provider,
  providerPaymentId,
  type,
  status,
  amountCents,
  currency,
  metadata,
}) {
  await db.query(
    `
      INSERT INTO payment_transactions (
        user_id,
        provider,
        provider_payment_id,
        type,
        status,
        amount_cents,
        currency,
        metadata,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        amount_cents = VALUES(amount_cents),
        currency = VALUES(currency),
        metadata = VALUES(metadata),
        updated_at = NOW()
    `,
    [
      userId,
      provider,
      providerPaymentId,
      type,
      status,
      amountCents,
      currency,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

async function findUserById(userId) {
  const [rows] = await db.query(
    "SELECT id, email, name FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

async function findUserByStripeCustomerId(customerId) {
  const [rows] = await db.query(
    `
      SELECT user_id
      FROM user_premium
      WHERE stripe_customer_id = ?
      LIMIT 1
    `,
    [customerId]
  );
  return rows[0] || null;
}

async function findUserByEmail(email) {
  const [rows] = await db.query(
    "SELECT id, name, email FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

module.exports = {
  getPremiumStatus,
  upsertPremiumStatus,
  insertPaymentTransaction,
  findUserById,
  findUserByStripeCustomerId,
  findUserByEmail,
};
