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

// ============================================
// ROTAS ADMIN
// ============================================
const adminUsersRoutes = require("./routes/admin/users");
const adminRewardsRoutes = require("./routes/admin/rewards");
const adminPartnersRoutes = require("./routes/admin/partners");
const adminReportsRoutes = require("./routes/admin/reports");
const adminMissionsRoutes = require("./routes/admin/missions");
const adminNotificationsRoutes = require("./routes/admin/notifications");

// ============================================
// ROTAS USER
// ============================================
const userProfileRoutes = require("./routes/user/profile");
const userMissionsRoutes = require("./routes/user/missions");
const userRewardsRoutes = require("./routes/user/rewards");
const userNotificationsRoutes = require("./routes/user/notifications");;

// middlewares
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
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
    const [rows] = await db.query("SELECT id, name, email, role, language FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });

    const user = rows[0];
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, language: user.language });
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

// ============================================
// ROTAS DO USUÁRIO (COM AUTH)
// ============================================
app.use("/user/profile", userProfileRoutes);
app.use("/user/missions", userMissionsRoutes);
app.use("/user/rewards", userRewardsRoutes);
app.use("/user/notifications", userNotificationsRoutes);


// iniciar servidor
app.listen(PORT, () => {
  console.log(`API a correr na porta ${PORT}`);
});
