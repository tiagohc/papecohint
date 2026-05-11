const express = require("express");
const router = express.Router();
const { auth } = require("../../authMiddleware");
const { analyzeDocumentHandler } = require("../../controllers/user/documentController");

router.use(auth);

/**
 * POST /user/documents/analyze
 * Body: multipart/form-data
 *   - document: file (PDF / image)
 *   - tipo: "fatura" | "bilhete"  (optional, auto-detected if omitted)
 */
router.post("/analyze", analyzeDocumentHandler);

module.exports = router;
