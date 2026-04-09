const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../../authMiddleware");
const {
  getInvoices,
  getInvoice,
  getInvoicesByUser,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require("../../controllers/admin/invoicesController");

router.use(auth, adminOnly);

router.get("/", getInvoices);
router.get("/user/:userId", getInvoicesByUser);
router.get("/:id", getInvoice);
router.post("/", createInvoice);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

module.exports = router;
