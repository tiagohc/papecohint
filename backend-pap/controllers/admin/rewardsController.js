const db = require("../../db");

// ============================
// CRIAR
// ============================
async function createReward(req, res) {
  let { name, description, points, stock, image_url, partner_id } = req.body;

  points = Number(points);
  stock = Number(stock);
  partner_id = Number(partner_id);

  if (!name || isNaN(points) || isNaN(stock) || !partner_id) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO rewards 
       (title, description, cost_points, stock, image_url, partner_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || "",
        points,
        stock,
        image_url || null,
        partner_id,
      ]
    );

    const [rows] = await db.query(
      `SELECT r.id,
              r.title AS name,
              r.description,
              r.cost_points AS points,
              r.stock,
              r.image_url,
              r.partner_id,
              p.name AS partner_name
       FROM rewards r
       LEFT JOIN partners p ON r.partner_id = p.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    // Criar notificações para todos os usuários
    const [users] = await db.query("SELECT id FROM users WHERE role = 'user'");
    const notificationTitle = "Novo Produto Disponível";
    const notificationMessage = `Um novo produto sustentável chegou à loja: '${name}'. Aproveite!`;

    for (const user of users) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, ?, 'reward', 0, NOW())`,
        [user.id, notificationTitle, notificationMessage]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("CREATE ERROR:", err.sqlMessage || err);
    res.status(500).json({ error: err.sqlMessage || "Erro no servidor" });
  }
}

// ============================
// LISTAR
// ============================
async function getRewards(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT r.id,
              r.title AS name,
              r.description,
              r.cost_points AS points,
              r.stock,
              r.image_url,
              r.partner_id,
              p.name AS partner_name
       FROM rewards r
       LEFT JOIN partners p ON r.partner_id = p.id`
    );

    res.json(rows);
  } catch (err) {
    console.error("LIST ERROR:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ============================
// OBTER 1
// ============================
async function getReward(req, res) {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT r.id,
              r.title AS name,
              r.description,
              r.cost_points AS points,
              r.stock,
              r.image_url,
              r.partner_id,
              p.name AS partner_name
       FROM rewards r
       LEFT JOIN partners p ON r.partner_id = p.id
       WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Reward não encontrada" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ============================
// EDITAR
// ============================
async function updateReward(req, res) {
  const { id } = req.params;
  let { name, description, points, stock, image_url, partner_id } = req.body;

  // Allow partial updates
  const updates = {};
  const values = [];
  let setClause = [];

  if (name !== undefined) {
    updates.title = name;
    setClause.push("title=?");
    values.push(name);
  }
  if (description !== undefined) {
    updates.description = description;
    setClause.push("description=?");
    values.push(description || "");
  }
  if (points !== undefined) {
    const numPoints = Number(points);
    if (isNaN(numPoints)) return res.status(400).json({ error: "Pontos inválidos" });
    updates.cost_points = numPoints;
    setClause.push("cost_points=?");
    values.push(numPoints);
  }
  if (stock !== undefined) {
    const numStock = Number(stock);
    if (isNaN(numStock)) return res.status(400).json({ error: "Stock inválido" });
    updates.stock = numStock;
    setClause.push("stock=?");
    values.push(numStock);
  }
  if (image_url !== undefined) {
    updates.image_url = image_url;
    setClause.push("image_url=?");
    values.push(image_url || null);
  }
  if (partner_id !== undefined) {
    const numPartnerId = Number(partner_id);
    if (isNaN(numPartnerId)) return res.status(400).json({ error: "Partner ID inválido" });
    updates.partner_id = numPartnerId;
    setClause.push("partner_id=?");
    values.push(numPartnerId);
  }

  if (setClause.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar" });
  }

  try {
    const query = `UPDATE rewards SET ${setClause.join(", ")} WHERE id=?`;
    values.push(id);
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Reward não encontrada" });
    }

    const [rows] = await db.query(
      `SELECT r.id,
              r.title AS name,
              r.description,
              r.cost_points AS points,
              r.stock,
              r.image_url,
              r.partner_id,
              p.name AS partner_name
       FROM rewards r
       LEFT JOIN partners p ON r.partner_id = p.id
       WHERE r.id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ============================
// DELETE
// ============================
async function deleteReward(req, res) {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM rewards WHERE id=?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Reward não encontrada" });
    }

    res.json({ message: "Reward removida com sucesso" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = {
  createReward,
  getRewards,
  getReward,
  updateReward,
  deleteReward,
};