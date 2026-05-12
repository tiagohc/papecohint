const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db");

// Verificação graceful: se a tabela partner_users ainda não existir na BD,
// o utilizador é tratado como 'user' normal em vez de lançar erro.
function isMissingPartnerUsersTable(err) {
  return err?.code === "ER_NO_SUCH_TABLE" && String(err?.sqlMessage || "").includes("partner_users");
}

// LOGIN
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Dados em falta" });

  try {
    const [rows] = await db.query(
      "SELECT id, name, email, password, role, status FROM users WHERE email = ?",
      [email]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Credenciais inválidas" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Credenciais inválidas" });
    if (user.status !== "active") return res.status(403).json({ error: "Utilizador inativo" });

    let partnerLinks = [];
    try {
      const [rowsPartner] = await db.query(
        "SELECT partner_id FROM partner_users WHERE user_id = ? LIMIT 1",
        [user.id]
      );
      partnerLinks = rowsPartner;
    } catch (partnerErr) {
      if (!isMissingPartnerUsersTable(partnerErr)) {
        throw partnerErr;
      }
    }

    // Se o utilizador está em partner_users, o role no token é 'partner' (sobrevém sobre users.role).
    // partner_id é incluído no token para que as rotas de parceiro o tenham disponível sem ir à BD.
    const isPartner = partnerLinks.length > 0;
    const authRole = isPartner ? "partner" : user.role;
    const partnerId = isPartner ? partnerLinks[0].partner_id : null;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: authRole, partner_id: partnerId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: authRole, partner_id: partnerId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro no servidor",
      details: err.message,
      stack: err.stack,
    });
  }
}

// REGISTER
async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "Dados em falta" });

  // username is used as the display name too
  const name = username;

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(409).json({ error: "Email já existe" });

    // Check username uniqueness
    const [existingUsername] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUsername.length > 0) return res.status(409).json({ error: "Username já existe" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, username, email, password, role, status) VALUES (?, ?, ?, ?, 'user', 'active')",
      [name, username, email, hashedPassword]
    );

    // login automático após registro
    const token = jwt.sign(
      { id: result.insertId, email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({ message: "Conta criada com sucesso", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro no servidor",
      details: err.message,
      stack: err.stack,
    });
  }
}

// FORGOT PASSWORD
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email em falta" });

  try {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ error: "Email não encontrado" });

    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600 * 1000); // token válido por 1 hora

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [token, expires, user.id]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const baseUrl = process.env.FRONTEND_URL || "https://papecohint.onrender.com";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"EcoHint" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperação de password",
      html: `<p>Clica no link para redefinir a password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });

    res.json({ message: "Email de recuperação enviado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// RESET PASSWORD
async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Dados em falta" });

  try {
    const [rows] = await db.query(
      "SELECT id, reset_token_expires FROM users WHERE reset_token = ?",
      [token]
    );
    if (rows.length === 0) return res.status(400).json({ error: "Token inválido" });

    const user = rows[0];
    if (new Date(user.reset_token_expires) < new Date())
      return res.status(400).json({ error: "Token expirado" });

    const hashedPassword = await bcrypt.hash(password, 10);
    // Limpa o token de reset após uso — impede reutilização do mesmo link.
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.json({ message: "Password redefinida com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = { login, register, forgotPassword, resetPassword };
