const { easypayPost } = require("../../services/easypayClient");
const {
  findUserById,
  insertPaymentTransaction,
} = require("../../models/user/premiumModel");

const PREMIUM_AMOUNT_EUR = 2.0;
const PREMIUM_AMOUNT_CENTS = 200;

async function createEasypayCheckout(req, res) {
  try {
    const userId = req.user.id;
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "Utilizador não encontrado" });
    }

    const manifest = await easypayPost("/checkout", {
      type: ["single"],
      payment: {
        methods: ["cc", "mb", "mbw"],
        type: "sale",
        currency: "EUR",
        capture: {
          descriptive: "EcoHint Premium Mensal",
        },
      },
      order: {
        items: [
          {
            description: "EcoHint Premium Mensal",
            quantity: 1,
            key: `premium-monthly`,
            value: PREMIUM_AMOUNT_EUR,
          },
        ],
        key: `ep-premium-${userId}-${Date.now()}`,
        value: PREMIUM_AMOUNT_EUR,
      },
      customer: {
        name: user.name,
        email: user.email,
      },
    });

    // Armazenar transação pendente para rastrear o pagamento no webhook
    await insertPaymentTransaction({
      userId,
      provider: "easypay",
      providerPaymentId: manifest.id,
      type: "premium_subscription",
      status: "pending",
      amountCents: PREMIUM_AMOUNT_CENTS,
      currency: "eur",
      metadata: { checkout_id: manifest.id, plan: "premium_monthly" },
    });

    // Retorna o manifest para o SDK do frontend renderizar o formulário
    res.json({ manifest });
  } catch (err) {
    console.error("Erro ao criar checkout EasyPay:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao criar checkout EasyPay" });
  }
}

module.exports = { createEasypayCheckout };
