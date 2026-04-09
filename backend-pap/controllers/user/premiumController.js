const { getStripeClient } = require("../../services/stripeClient");
const {
  getPremiumStatus,
  upsertPremiumStatus,
  findUserById,
} = require("../../models/user/premiumModel");

function getFrontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:3000";
}

async function getStatus(req, res) {
  try {
    const status = await getPremiumStatus(req.user.id);
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter status premium" });
  }
}

async function createCheckoutSession(req, res) {
  try {
    const userId = req.user.id;
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const stripePriceId = process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY;
    if (!stripePriceId) {
      return res.status(500).json({ error: "STRIPE_PRICE_ID_PREMIUM_MONTHLY não configurado" });
    }

    const stripe = getStripeClient();
    const frontendUrl = getFrontendUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: String(userId),
        plan: "premium_monthly",
      },
      success_url: `${frontendUrl}/user/premium?checkout=success`,
      cancel_url: `${frontendUrl}/user/premium?checkout=cancel`,
      allow_promotion_codes: true,
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar checkout premium" });
  }
}

async function cancelSubscription(req, res) {
  try {
    const userId = req.user.id;
    const status = await getPremiumStatus(userId);

    if (!status?.stripe_subscription_id) {
      return res.status(400).json({ error: "Assinatura ativa não encontrada" });
    }

    const stripe = getStripeClient();
    await stripe.subscriptions.update(status.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await upsertPremiumStatus({
      userId,
      status: "cancellation_pending",
      plan: status.plan || "premium_monthly",
      stripeCustomerId: status.stripe_customer_id,
      stripeSubscriptionId: status.stripe_subscription_id,
      currentPeriodEnd: status.current_period_end,
    });

    res.json({ message: "Cancelamento agendado para o fim do período atual" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cancelar assinatura premium" });
  }
}

async function activatePremium(req, res) {
  try {
    const userId = req.user.id;

    // Set premium active for 30 days
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);
    const periodEndMysql = periodEnd.toISOString().slice(0, 19).replace("T", " ");

    await upsertPremiumStatus({
      userId,
      status: "active",
      plan: "premium_monthly",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: periodEndMysql,
    });

    res.json({ status: "active", current_period_end: periodEndMysql });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao ativar premium" });
  }
}

module.exports = {
  getStatus,
  createCheckoutSession,
  cancelSubscription,
  activatePremium,
};
