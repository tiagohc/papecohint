const db = require("../../db");

// Criar parceiro
async function createPartner({ name, description, contact_email, website_url }) {
  const [result] = await db.query(
    "INSERT INTO partners (name, description, contact_email, website_url) VALUES (?, ?, ?, ?)",
    [name, description || "", contact_email, website_url || ""]
  );

  return await getPartnerById(result.insertId);
}

// Listar todos os parceiros
async function getAllPartners() {
  const [partners] = await db.query(
    "SELECT id, name, description, contact_email, website_url, status, created_at FROM partners ORDER BY created_at DESC"
  );
  return partners;
}

// Obter parceiro por ID
async function getPartnerById(partnerId) {
  const [partners] = await db.query(
    "SELECT * FROM partners WHERE id = ?",
    [partnerId]
  );
  return partners.length > 0 ? partners[0] : null;
}

// Atualizar parceiro
async function updatePartner(partnerId, { name, description, contact_email, website_url, status }) {
  const [result] = await db.query(
    "UPDATE partners SET name = ?, description = ?, contact_email = ?, website_url = ?, status = ? WHERE id = ?",
    [name, description || "", contact_email, website_url || "", status, partnerId]
  );

  return result.affectedRows > 0 ? await getPartnerById(partnerId) : null;
}

// Deletar parceiro
async function deletePartner(partnerId) {
  const [result] = await db.query("DELETE FROM partners WHERE id = ?", [partnerId]);
  return result.affectedRows > 0;
}

module.exports = {
  createPartner,
  getAllPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
};
