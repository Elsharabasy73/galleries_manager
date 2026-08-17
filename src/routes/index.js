const express = require("express");

const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      service: "galleries-manager",
      uptime: process.uptime(),
    },
  });
});

router.use("/auth", authRoutes);

module.exports = router;
