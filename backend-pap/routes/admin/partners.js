const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../../authMiddleware");
const db = require("../../db");
const bcrypt = require("bcryptjs");

function isMissingPartnerUsersTable(err) {
  return err?.code === "ER_NO_SUCH_TABLE" && String(err?.sqlMessage || "").includes("partner_users");
}

// todas as rotas precisam de autenticação
router.use(auth);

// ============================
// CRIAR PARCEIRO
// ============================
router.post("/", adminOnly, async (req, res) => {
  const {
    name,
    description,
    account_name,
    account_email,
    account_password,
  } = req.body;

  if (!name) return res.status(400).json({ error: "Nome é obrigatório" });
  if (!account_email) {
    return res.status(400).json({ error: "Email da conta do parceiro é obrigatório" });
  }
  if (!account_password) {
    return res.status(400).json({ error: "Password da conta do parceiro é obrigatória" });
  }

  let connection;

  try {
    connection = await db.getConnection();

    await connection.beginTransaction();

    let partnerUserId = null;

    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [account_email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ error: "Email da conta de parceiro já existe" });
    }

    const [result] = await connection.query(
      "INSERT INTO partners (name, description, active) VALUES (?, ?, 1)",
      [name, description || ""]
    );

    const hashedPassword = await bcrypt.hash(account_password, 10);
    const [userInsert] = await connection.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')",
      [account_name || name, account_email, hashedPassword]
    );

    partnerUserId = userInsert.insertId;

    await connection.query(
      "INSERT INTO partner_users (partner_id, user_id) VALUES (?, ?)",
      [result.insertId, partnerUserId]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      active: 1,
      partner_user_id: partnerUserId,
      has_account: true,
    });
  } catch (err) {
    if (isMissingPartnerUsersTable(err)) {
      return res.status(503).json({
        error: "Tabela partner_users não existe. Execute: npm run db:partners-setup",
      });
    }

    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // no-op
      }
      connection.release();
    }
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// ============================
// LISTAR PARCEIROS
// ============================
router.get("/", adminOnly, async (req, res) => {
  try {
    let rows = [];
    try {
      const [rowsWithAccounts] = await db.query(
        `SELECT p.id,
                p.name,
                p.description,
                p.active,
                pu.user_id AS partner_user_id,
                u.email AS partner_account_email
         FROM partners p
         LEFT JOIN partner_users pu ON pu.partner_id = p.id
         LEFT JOIN users u ON u.id = pu.user_id`
      );
      rows = rowsWithAccounts;
    } catch (err) {
      if (!isMissingPartnerUsersTable(err)) {
        throw err;
      }

      const [rowsFallback] = await db.query("SELECT id, name, description, active FROM partners");
      rows = rowsFallback.map((p) => ({ ...p, partner_user_id: null, partner_account_email: null }));
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// ============================
// CRIAR / VINCULAR CONTA A PARCEIRO EXISTENTE
// ============================
router.post("/:id/account", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { account_name, account_email, account_password } = req.body;

  if (!account_email) {
    return res.status(400).json({ error: "Email da conta do parceiro é obrigatório" });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [partners] = await connection.query("SELECT id, name FROM partners WHERE id = ?", [id]);
    if (partners.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Parceiro não encontrado" });
    }

    const [alreadyLinked] = await connection.query(
      "SELECT user_id FROM partner_users WHERE partner_id = ? LIMIT 1",
      [id]
    );
    if (alreadyLinked.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ error: "Parceiro já possui conta associada" });
    }

    let partnerUserId;
    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [account_email]
    );

    if (existingUsers.length > 0) {
      partnerUserId = existingUsers[0].id;

      const [userAlreadyLinked] = await connection.query(
        "SELECT partner_id FROM partner_users WHERE user_id = ? LIMIT 1",
        [partnerUserId]
      );

      if (userAlreadyLinked.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ error: "Este utilizador já está associado a outro parceiro" });
      }
    } else {
      if (!account_password) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: "Password é obrigatória para criar nova conta" });
      }

      const hashedPassword = await bcrypt.hash(account_password, 10);
      const [userInsert] = await connection.query(
        "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')",
        [account_name || partners[0].name, account_email, hashedPassword]
      );

      partnerUserId = userInsert.insertId;
    }

    await connection.query(
      "INSERT INTO partner_users (partner_id, user_id) VALUES (?, ?)",
      [id, partnerUserId]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: "Conta de parceiro associada com sucesso",
      partner_id: Number(id),
      partner_user_id: partnerUserId,
      partner_account_email: account_email,
    });
  } catch (err) {
    if (isMissingPartnerUsersTable(err)) {
      return res.status(503).json({
        error: "Tabela partner_users não existe. Execute: npm run db:partners-setup",
      });
    }

    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // no-op
      }
      connection.release();
    }

    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// ============================
// OBTER PRODUTOS (REWARDS) DE UM PARTNER
// ============================
router.get("/:id/products", adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT id, title AS name, description, cost_points AS points, stock, image_url
       FROM rewards
       WHERE partner_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// ============================
// ATUALIZAR STOCK DE UMA REWARD
// ============================
router.put("/:partnerId/products/:productId", adminOnly, async (req, res) => {
  const { partnerId, productId } = req.params;
  const { stock } = req.body;

  if (isNaN(Number(stock))) return res.status(400).json({ error: "Stock inválido" });

  try {
    const [result] = await db.query(
      "UPDATE rewards SET stock=? WHERE id=? AND partner_id=?",
      [Number(stock), productId, partnerId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.json({ message: "Stock atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// ============================
// APAGAR UM PRODUTO (REWARD) DE UM PARTNER
// ============================
router.delete("/:partnerId/products/:productId", adminOnly, async (req, res) => {
  const { partnerId, productId } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM rewards WHERE id=? AND partner_id=?",
      [productId, partnerId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.json({ message: "Produto removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// ============================
// APAGAR PARCEIRO
// ============================
router.delete("/:id", adminOnly, async (req, res) => {
  const { id } = req.params;

  try {
    // First, delete all rewards associated with the partner
    await db.query("DELETE FROM rewards WHERE partner_id=?", [id]);

    await db.query("DELETE FROM partner_users WHERE partner_id=?", [id]);

    // Then delete the partner
    const [result] = await db.query("DELETE FROM partners WHERE id=?", [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Parceiro não encontrado" });

    res.json({ message: "Parceiro removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

module.exports = router;