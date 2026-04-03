const express = require("express");
const router = express.Router();
const { createUser, getUsers, getUser, updateUser, deleteUser } = require("../../controllers/admin/usersController");
const { auth, adminOnly } = require("../../authMiddleware");

router.use(auth);

// CRUD de usuários (somente admin)
router.post("/", adminOnly, createUser);
router.get("/", adminOnly, getUsers);
router.get("/:id", adminOnly, getUser);
router.put("/:id", adminOnly, updateUser);
router.delete("/:id", adminOnly, deleteUser);

module.exports = router;
