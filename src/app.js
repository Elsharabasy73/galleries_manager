const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const errorHandler = require("./middlewares/error.middleware");
const notFound = require("./middlewares/notFound.middleware");
const apiRoutes = require("./routes");

const createApp = () => {
  const app = express();
  //disable x-powered-by header for security reasons
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
app.use(
  "/storage",
  express.static(path.join(__dirname, "..", "storage"))
);
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  app.use("/api/v1", apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
