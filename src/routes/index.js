const express = require("express");

const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const galleryRoutes = require("../modules/galleries/gallery.routes");

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
router.use("/galleries", galleryRoutes);

module.exports = router;
