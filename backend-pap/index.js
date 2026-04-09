require("dotenv").config(); // 🔹 carregar .env primeiro
const cors = require("cors");
const express = require("express");
const app = express();
const PORT = 8000;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db"); // 🔹 conexão MySQL
const { auth } = require("./authMiddleware");
const { login, register, forgotPassword, resetPassword } = require("./controllers/authController");
const { handleStripeWebhook, handleEasypayWebhook } = require("./controllers/paymentsController");

// ============================================
// ROTAS ADMIN
// ============================================
const adminUsersRoutes = require("./routes/admin/users");
const adminRewardsRoutes = require("./routes/admin/rewards");
const adminPartnersRoutes = require("./routes/admin/partners");
const adminReportsRoutes = require("./routes/admin/reports");
const adminMissionsRoutes = require("./routes/admin/missions");
const adminNotificationsRoutes = require("./routes/admin/notifications");
const adminInvoicesRoutes = require("./routes/admin/invoices");

// ============================================
// ROTAS USER
// ============================================
const userProfileRoutes = require("./routes/user/profile");
const userMissionsRoutes = require("./routes/user/missions");
const userRewardsRoutes = require("./routes/user/rewards");
const userNotificationsRoutes = require("./routes/user/notifications");;
const userPremiumRoutes = require("./routes/user/premium");
const userEasypayRoutes = require("./routes/user/easypay");
const partnerRewardsRoutes = require("./routes/partner/rewards");

// middlewares
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// O webhook do Stripe precisa do body raw para validação de assinatura.
app.post("/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
// Webhook EasyPay (JSON normal)
app.post("/payments/easypay/webhook", express.json(), handleEasypayWebhook);

app.use(express.json()); // necessário para receber JSON no body

// ============================================
// ROTAS PÚBLICAS
// ============================================
app.get('/', (req, res) => {
  res.send('Hello from Node.js backend!');
});

// ============================================
// ROTAS DE AUTENTICAÇÃO (SEM AUTH)
// ============================================
app.post("/login", login);
app.post("/register", register);
app.post("/forgot-password", forgotPassword);
app.post("/reset-password", resetPassword);

// rota para obter info do usuário logado
app.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });

    const user = rows[0];
    let partnerLinks = [];
    try {
      const [rowsPartner] = await db.query(
        "SELECT partner_id FROM partner_users WHERE user_id = ? LIMIT 1",
        [user.id]
      );
      partnerLinks = rowsPartner;
    } catch (partnerErr) {
      const isMissingPartnerUsers =
        partnerErr?.code === "ER_NO_SUCH_TABLE" &&
        String(partnerErr?.sqlMessage || "").includes("partner_users");

      if (!isMissingPartnerUsers) {
        throw partnerErr;
      }
    }

    const role = partnerLinks.length > 0 ? "partner" : user.role;
    const partner_id = partnerLinks.length > 0 ? partnerLinks[0].partner_id : null;

    res.json({ id: user.id, name: user.name, email: user.email, role, partner_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter usuário" });
  }
});

// ============================================
// ROTAS DE ADMIN (COM AUTH + ADMIN ONLY)
// ============================================
app.use("/admin/users", adminUsersRoutes);
app.use("/admin/rewards", adminRewardsRoutes);
app.use("/admin/partners", adminPartnersRoutes);
app.use("/admin/reports", adminReportsRoutes);
app.use("/admin/missions", adminMissionsRoutes);
app.use("/admin/notifications", adminNotificationsRoutes);
app.use("/admin/invoices", adminInvoicesRoutes);

// ============================================
// ROTAS DO USUÁRIO (COM AUTH)
// ============================================
app.use("/user/profile", userProfileRoutes);
app.use("/user/missions", userMissionsRoutes);
app.use("/user/rewards", userRewardsRoutes);
app.use("/user/notifications", userNotificationsRoutes);
app.use("/user/premium", userPremiumRoutes);
app.use("/user/easypay", userEasypayRoutes);
app.use("/partner/rewards", partnerRewardsRoutes);


// iniciar servidor
app.listen(PORT, () => {
  console.log(`API a correr na porta ${PORT}`);
});
