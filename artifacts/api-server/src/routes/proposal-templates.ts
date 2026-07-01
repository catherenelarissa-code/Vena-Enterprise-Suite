import { Router } from "express";

const router = Router();

// Placeholder routes for proposal templates
router.get("/", async (req, res) => {
  try {
    return res.status(501).json({ error: "Not Implemented" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    return res.status(501).json({ error: "Not Implemented" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    return res.status(501).json({ error: "Not Implemented" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    return res.status(501).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
