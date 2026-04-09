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

module.exports = { sendPushToUser, sendPushToAll };
