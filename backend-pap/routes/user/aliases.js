const express = require("express");
const router = express.Router();
const { auth } = require("../../authMiddleware");
const {
  listAliases,
  addAlias,
  removeAlias,
} = require("../../controllers/user/energyInvoicesController");

router.use(auth);

router.get("/", listAliases);
router.post("/", addAlias);
router.delete("/:id", removeAlias);

module.exports = router;
