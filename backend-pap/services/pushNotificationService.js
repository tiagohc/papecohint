const db = require("../db");
const firebaseAdmin = require("./firebaseAdmin");

/**
 * Send push notification to a specific user (all their devices)
 */
async function sendPushToUser(userId, title, body, data = {}) {
  if (!firebaseAdmin) return;

  try {
    const [tokens] = await db.query(
      "SELECT token FROM fcm_tokens WHERE user_id = ?",
      [userId]
    );

    if (tokens.length === 0) return;

    const message = {
      notification: { title, body },
      data: { ...data, click_action: "/" },
      tokens: tokens.map((t) => t.token),
    };

    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            tokensToRemove.push(tokens[idx].token);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        await db.query(
          "DELETE FROM fcm_tokens WHERE token IN (?)",
          [tokensToRemove]
        );
        console.log(`Removed ${tokensToRemove.length} stale FCM tokens for user ${userId}`);
      }
    }
  } catch (err) {
    console.error("Push notification error:", err.message);
  }
}

/**
 * Send push notification to ALL users
 */
async function sendPushToAll(title, body, data = {}) {
  if (!firebaseAdmin) return;

  try {
    const [tokens] = await db.query("SELECT token FROM fcm_tokens");

    if (tokens.length === 0) return;

    // FCM sendEachForMulticast supports max 500 tokens per batch
    const batchSize = 500;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);

      const message = {
        notification: { title, body },
        data: { ...data, click_action: "/" },
        tokens: batch.map((t) => t.token),
      };

      const response = await firebaseAdmin.messaging().sendEachForMulticast(message);

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const tokensToRemove = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code;
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              tokensToRemove.push(batch[idx].token);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          await db.query(
            "DELETE FROM fcm_tokens WHERE token IN (?)",
            [tokensToRemove]
          );
        }
      }
    }
  } catch (err) {
    console.error("Push notification (broadcast) error:", err.message);
  }
}

/**
 * Send push notification to all admin users
 */
async function sendPushToAdmins(title, body, data = {}) {
  if (!firebaseAdmin) return;

  try {
    const [admins] = await db.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );
    for (const admin of admins) {
      await sendPushToUser(admin.id, title, body, data);
    }
  } catch (err) {
    console.error("Push to admins error:", err.message);
  }
}

/**
 * Send push notification to all users linked to a partner
 */
async function sendPushToPartnerUsers(partnerId, title, body, data = {}) {
  if (!firebaseAdmin || !partnerId) return;

  try {
    const [rows] = await db.query(
      "SELECT user_id FROM partner_users WHERE partner_id = ?",
      [partnerId]
    );
    for (const row of rows) {
      await sendPushToUser(row.user_id, title, body, data);
    }
  } catch (err) {
    // partner_users table may not exist yet — silently skip
    console.error("Push to partner users error:", err.message);
  }
}

/**
 * Send push notification to ALL users with per-language content.
 * Falls back to PT text for users with no language stored.
 */
async function sendPushToAllLocalized(titlePt, bodyPt, titleEn, bodyEn, data = {}) {
  if (!firebaseAdmin) return;

  try {
    const [tokens] = await db.query(
      "SELECT token, COALESCE(lang, 'pt') AS lang FROM fcm_tokens"
    ).catch(() => db.query("SELECT token, 'pt' AS lang FROM fcm_tokens"));

    if (tokens.length === 0) return;

    const ptTokens = tokens.filter(t => t.lang !== 'en').map(t => t.token);
    const enTokens = tokens.filter(t => t.lang === 'en').map(t => t.token);

    const batchSize = 500;
    const sendBatch = async (batch, title, body) => {
      for (let i = 0; i < batch.length; i += batchSize) {
        const slice = batch.slice(i, i + batchSize);
        const message = {
          notification: { title, body },
          data: { ...data, click_action: "/" },
          tokens: slice,
        };
        const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
        if (response.failureCount > 0) {
          const tokensToRemove = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const code = resp.error?.code;
              if (
                code === "messaging/registration-token-not-registered" ||
                code === "messaging/invalid-registration-token"
              ) {
                tokensToRemove.push(slice[idx]);
              }
            }
          });
          if (tokensToRemove.length > 0) {
            await db.query("DELETE FROM fcm_tokens WHERE token IN (?)", [tokensToRemove]);
          }
        }
      }
    };

    if (ptTokens.length > 0) await sendBatch(ptTokens, titlePt, bodyPt);
    if (enTokens.length > 0) await sendBatch(enTokens, titleEn, bodyEn);
  } catch (err) {
    console.error("Push notification (localized broadcast) error:", err.message);
  }
}

module.exports = { sendPushToUser, sendPushToAll, sendPushToAllLocalized, sendPushToAdmins, sendPushToPartnerUsers };
