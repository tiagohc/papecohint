const express = require("express");
const router = express.Router();
const { auth } = require("../../authMiddleware");
const {
  uploadInvoice,
  confirmInvoice,
  rejectInvoice,
  listInvoices,
} = require("../../controllers/user/energyInvoicesController");

router.use(auth);

// List user's energy invoices
router.get("/", listInvoices);

// Upload a new invoice file (multipart/form-data, field: "invoice")
router.post("/upload", uploadInvoice);

// Confirm extracted data → triggers mission auto-completion
router.post("/:id/confirm", confirmInvoice);

// Reject / remove a pending invoice
router.delete("/:id", rejectInvoice);

module.exports = router;
