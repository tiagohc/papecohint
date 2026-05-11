const jwt = require("jsonwebtoken");

// Middleware JWT: valida o token e popula req.user = { id, email, role, partner_id }
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token inválido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // id, email, role
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Bloqueia qualquer utilizador que não seja admin (role !== 'admin')
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

// Exige role='partner' E partner_id no token (atribuído no login se existir em partner_users)
function partnerOnly(req, res, next) {
  if (!req.user || req.user.role !== "partner" || !req.user.partner_id) {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

module.exports = { auth, adminOnly, partnerOnly };
