const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db");

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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// REGISTER
async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Dados em falta" });

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(409).json({ error: "Email já existe" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')",
      [name, email, hashedPassword]
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
    res.status(500).json({ error: "Erro no servidor" });
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
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hora

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

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

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
