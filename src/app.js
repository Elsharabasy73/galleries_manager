require("./config/jsxLoader");

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const errorHandler = require("./middlewares/error.middleware");
const notFound = require("./middlewares/notFound.middleware");
const apiRoutes = require("./routes");
const {
  getStorageFileUrl,
  getStorageProvider,
  STORAGE_TYPES,
} = require("./shared/utils/storage/storage");

const createApp = () => {
  const app = express();
  app.set("query parser", "extended");
  //disable x-powered-by header for security reasons
  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },
    }),
  );
  // LAN fix: allow phone origin http://192.168.x.x:5173 as well as localhost
  app.use(
    cors({
      origin: true, // reflect request origin - allows any localhost/LAN origin in dev
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  if (getStorageProvider() === "r2") {
    // Continue serving legacy files locally before redirecting missing files to R2.
    app.use("/storage", express.static(path.join(__dirname, "..", "storage")));
    app.use("/storage", (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }

      const [root, type, folderName, fileName, ...extraSegments] = req.path
        .split("/")
        .filter(Boolean);

      if (
        root !== "uploads" ||
        !Object.values(STORAGE_TYPES).includes(type) ||
        !folderName ||
        !fileName ||
        extraSegments.length
      ) {
        return next();
      }

      res.redirect(302, getStorageFileUrl(type, folderName, fileName));
    });
  } else {
    app.use("/storage", express.static(path.join(__dirname, "..", "storage")));
  }
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  app.use("/api/v1", apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
