require("dotenv").config(); // 🔹 carregar .env primeiro
const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const app = express();
const PORT = process.env.PORT || 8000;
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
const userEnergyInvoicesRoutes = require("./routes/user/energyInvoices");
const userAliasesRoutes = require("./routes/user/aliases");
const userDocumentsRoutes = require("./routes/user/documents");
const partnerRewardsRoutes = require("./routes/partner/rewards");

// middlewares
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:3000"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// O webhook do Stripe precisa do body raw para validação de assinatura.
app.post("/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
// Webhook EasyPay (JSON normal)
app.post("/payments/easypay/webhook", express.json(), handleEasypayWebhook);

// Rate limiting — permite 300 pedidos por 15 min por IP (uso normal da app)
// Auth endpoints têm limite mais apertado para evitar brute force
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados pedidos. Tenta novamente em breve." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas tentativas de login/registo. Tenta novamente em 15 minutos." },
});
app.use("/login", authLimiter);
app.use("/register", authLimiter);
app.use("/forgot-password", authLimiter);
app.use(generalLimiter);

app.use(express.json({ limit: "15mb" })); // necessário para receber JSON no body (15mb para base64 de imagens)

// Serve uploaded invoice files (auth protected via query param not needed for MVP — path is unguessable)
const { auth: authMiddleware } = require("./authMiddleware");
app.use("/uploads/invoices", authMiddleware, require("express").static(require("path").join(__dirname, "uploads", "invoices")));
// Serve avatar images publicly (filenames are unguessable)
app.use("/uploads/avatars", require("express").static(require("path").join(__dirname, "uploads", "avatars")));

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
    const [rows] = await db.query("SELECT id, name, email, role, eco_points FROM users WHERE id = ?", [req.user.id]);
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

    // Role efectivo: se o utilizador estiver em partner_users, é tratado como parceiro.
    // Isto permite que um utilizador normal seja promovido a parceiro sem alterar users.role.
    const role = partnerLinks.length > 0 ? "partner" : user.role;
    const partner_id = partnerLinks.length > 0 ? partnerLinks[0].partner_id : null;

    res.json({ id: user.id, name: user.name, email: user.email, role, partner_id, eco_points: user.eco_points || 0 });
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
app.use("/user/energy-invoices", userEnergyInvoicesRoutes);
app.use("/user/aliases", userAliasesRoutes);
app.use("/user/documents", userDocumentsRoutes);
app.use("/partner/rewards", partnerRewardsRoutes);

// Ranking público para utilizadores autenticados
app.get("/user/ranking", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, eco_points FROM users WHERE role = 'user' AND eco_points > 0 ORDER BY eco_points DESC LIMIT 50"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Impacto ambiental real por tipo de missão
app.get("/user/impact", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Coordenadas aproximadas de paragens MobiAzores em São Miguel
    const STOPS = {
      "ponta delgada": [37.7412, -25.6756],
      "ribeira grande": [37.8311, -25.5171],
      "furnas": [37.7787, -25.3174],
      "nordeste": [37.8382, -25.1754],
      "vila franca do campo": [37.7158, -25.4265],
      "vila franca": [37.7158, -25.4265],
      "lagoa": [37.7302, -25.5612],
      "agua de pau": [37.7197, -25.5139],
      "mosteiros": [37.8923, -25.8243],
      "ginetes": [37.8508, -25.8020],
      "arrifes": [37.7560, -25.6935],
      "fajã de baixo": [37.7455, -25.6612],
      "faja de baixo": [37.7455, -25.6612],
      "rabo de peixe": [37.8126, -25.5733],
      "caloura": [37.7022, -25.4951],
      "água de pau": [37.7197, -25.5139],
      "capelas": [37.8424, -25.6591],
      "bretanha": [37.8637, -25.7421],
      // Terceira
      "angra do heroismo": [38.6542, -27.2194],
      "angra": [38.6542, -27.2194],
      "praia da vitoria": [38.7333, -27.0583],
      "praia da vitória": [38.7333, -27.0583],
      "praia": [38.7333, -27.0583],
      "biscoitos": [38.7850, -27.2501],
      "sao sebastiao": [38.6667, -27.1167],
      "sao sebastião": [38.6667, -27.1167],
    };

    function normalizeStop(name) {
      return (name || "").toLowerCase().trim()
        .replace(/\s+/g, " ")
        .replace(/[àáâã]/g, "a").replace(/[éê]/g, "e")
        .replace(/[íî]/g, "i").replace(/[óôõ]/g, "o")
        .replace(/[úû]/g, "u");
    }

    function haversineKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Poupança CO₂ por km (carro médio 170g - autocarro 40g por passageiro = 130g/km = 0.13kg/km)
    const CO2_PER_KM = 0.13;
    const AVG_ROUTE_KM = 15; // default se não soubermos origem/destino

    // Bilhetes de transporte validados
    let co2Transport = 0;
    let tripsCount = 0;
    try {
      const [tickets] = await db.query(
        "SELECT origem, destino FROM transport_tickets WHERE user_id = ?",
        [userId]
      );
      for (const t of tickets) {
        const o = normalizeStop(t.origem);
        const d = normalizeStop(t.destino);
        const coordO = STOPS[o];
        const coordD = STOPS[d];
        let km = AVG_ROUTE_KM;
        if (coordO && coordD) {
          km = haversineKm(coordO[0], coordO[1], coordD[0], coordD[1]);
          if (km < 1) km = AVG_ROUTE_KM; // fallback se mesma paragem
        }
        co2Transport += km * CO2_PER_KM;
        tripsCount++;
      }
    } catch (_) {}

    // Faturas de energia confirmadas (kWh poupado calculado como diferença)
    let energySavedKwh = 0;
    try {
      const [invoices] = await db.query(
        "SELECT kwh FROM energy_invoices WHERE user_id = ? AND status = 'confirmed'",
        [userId]
      );
      // Cada fatura kwh_reduce representa economia vs período anterior
      // Como não temos baseline, estimamos 10% de poupança por fatura confirmada
      for (const inv of invoices) {
        if (inv.kwh && inv.kwh > 0) energySavedKwh += inv.kwh * 0.1;
      }
    } catch (_) {}

    // Missões de foto genéricas concluídas (ex: reciclagem, etc.)
    let photoMissions = 0;
    try {
      const [pm] = await db.query(
        `SELECT COUNT(*) AS cnt FROM user_missions um
         JOIN missions m ON m.id = um.mission_id
         WHERE um.user_id = ? AND um.verified = 1
           AND (m.verification_type = 'photo' OR m.verification_type IS NULL)`,
        [userId]
      );
      photoMissions = pm[0]?.cnt || 0;
    } catch (_) {}

    // CO₂ de missões genéricas (reciclagem, consumo consciente, etc.) ~0.5kg/missão
    const co2Other = photoMissions * 0.5;
    const co2Total = co2Transport + co2Other + energySavedKwh * 0.233; // 0.233 kg CO₂/kWh (Portugal grid)

    res.json({
      co2_kg: Math.round(co2Total * 10) / 10,
      energy_kwh: Math.round(energySavedKwh * 10) / 10,
      trips: tripsCount,
      photo_missions: photoMissions,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ensure uploads directories exist
["uploads/invoices", "uploads/documents", "uploads/avatars"].forEach((dir) => {
  require("fs").mkdirSync(require("path").join(__dirname, dir), { recursive: true });
});

// Auto-migration: add username column if not exists
db.query("ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL AFTER name")
  .catch(err => { if (err.code !== "ER_DUP_FIELDNAME") console.error("Migration username:", err.message); });

// iniciar servidor
app.listen(PORT, () => {
  console.log(`API a correr na porta ${PORT}`);
});
