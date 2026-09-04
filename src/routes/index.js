const express = require("express");

const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/user.routes");
const galleryRoutes = require("../modules/galleries/gallery.routes");
const categoryRoutes = require("../modules/categories/category.routes");
const employeeRoutes = require("../modules/employees/employee.routes");
const productRoutes = require("../modules/products/product.routes");
const wishlistRoutes = require("../modules/wishlist/wishlist.routes");

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
router.use("/users", userRoutes);
router.use("/galleries", galleryRoutes);
router.use("/gallery", galleryRoutes); // alias for singular as requested {{LURL}}/api/v1/gallery/:id/products
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/employees", employeeRoutes);
router.use("/wishlist", wishlistRoutes);

module.exports = router;
