const { getStripeClient } = require("../services/stripeClient");
const { easypayGet } = require("../services/easypayClient");
const {
  upsertPremiumStatus,
  insertPaymentTransaction,
  findUserByStripeCustomerId,
  findUserByEmail,
} = require("../models/user/premiumModel");

function unixToMysqlDate(unix) {
  if (!unix) return null;
  const date = new Date(unix * 1000);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function handleStripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET não configurada" });
  }

  let event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.error("Erro ao validar webhook Stripe:", err.message);
    return res.status(400).json({ error: `Webhook inválido: ${err.message}` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = Number(session.metadata?.userId || 0);

      if (userId > 0) {
        await insertPaymentTransaction({
          userId,
          provider: "stripe",
          providerPaymentId: session.payment_intent || session.id,
          type: "premium_subscription",
          status: "succeeded",
          amountCents: session.amount_total || 0,
          currency: session.currency || "eur",
          metadata: {
            checkout_session_id: session.id,
            subscription_id: session.subscription || null,
          },
        });

        await upsertPremiumStatus({
          userId,
          status: "active",
          plan: "premium_monthly",
          stripeCustomerId: session.customer || null,
          stripeSubscriptionId: session.subscription || null,
          currentPeriodEnd: null,
        });
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = String(subscription.customer || "");
      const linked = await findUserByStripeCustomerId(customerId);

      if (linked?.user_id) {
        await upsertPremiumStatus({
          userId: linked.user_id,
          status: subscription.status === "active" || subscription.status === "trialing" ? "active" : "inactive",
          plan: "premium_monthly",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: unixToMysqlDate(subscription.current_period_end),
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = String(subscription.customer || "");
      const linked = await findUserByStripeCustomerId(customerId);

      if (linked?.user_id) {
        await upsertPremiumStatus({
          userId: linked.user_id,
          status: "canceled",
          plan: "premium_monthly",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: unixToMysqlDate(subscription.current_period_end),
        });
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Erro ao processar webhook Stripe:", err);
    return res.status(500).json({ error: "Erro ao processar webhook" });
  }
}

async function handleEasypayWebhook(req, res) {
  // Responder 200 imediatamente (EasyPay exige resposta em 20s)
  res.status(200).send("OK");

  const notification = req.body;
  const singlePaymentId = notification?.id;

  if (!singlePaymentId) {
    console.warn("EasyPay webhook: payload sem ID", notification);
    return;
  }

  // Processar apenas capturas com sucesso
  if (notification.status !== "success" || notification.type !== "capture") {
    return;
  }

  try {
    // Verificar autenticidade consultando a API da EasyPay
    const payment = await easypayGet(`/single/${singlePaymentId}`);

    const email = payment.customer?.email;
    if (!email) {
      console.warn("EasyPay webhook: sem email no pagamento", singlePaymentId);
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      console.warn("EasyPay webhook: utilizador não encontrado para email", email);
      return;
    }

    const amountCents = Math.round((payment.value || 2) * 100);

    await insertPaymentTransaction({
      userId: user.id,
      provider: "easypay",
      providerPaymentId: singlePaymentId,
      type: "premium_subscription",
      status: "succeeded",
      amountCents,
      currency: "eur",
      metadata: { easypay_payment_id: singlePaymentId, plan: "premium_monthly" },
    });

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);
    const periodEndMysql = periodEnd.toISOString().slice(0, 19).replace("T", " ");

    await upsertPremiumStatus({
      userId: user.id,
      status: "active",
      plan: "premium_monthly",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: periodEndMysql,
    });

    console.log(`✅ EasyPay: Premium ativado para userId=${user.id} até ${periodEndMysql}`);
  } catch (err) {
    console.error("Erro ao processar webhook EasyPay:", err.message);
  }
}

module.exports = { handleStripeWebhook, handleEasypayWebhook };
