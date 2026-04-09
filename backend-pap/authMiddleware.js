const jwt = require("jsonwebtoken");

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

// middleware para rotas apenas de admin
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

function partnerOnly(req, res, next) {
  if (!req.user || req.user.role !== "partner" || !req.user.partner_id) {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

module.exports = { auth, adminOnly, partnerOnly };
