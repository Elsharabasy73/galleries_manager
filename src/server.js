const createApp = require("./app");
const { getEnvironment } = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/prisma");
const logger = require("./config/logger");

let server;
let isShuttingDown = false;

//shutting down the server gracefully on SIGINT and SIGTERM
const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully.`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  process.exit(exitCode);
};

const startServer = async () => {
  const { port } = getEnvironment();

  await connectDatabase();

  server = createApp().listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
};
//sigint mean ctrl+c
process.on("SIGINT", () => shutdown("SIGINT"));
//sigterm mean kill pid
process.on("SIGTERM", () => shutdown("SIGTERM"));
//unhandledRejection mean promise rejection
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection", error);
  shutdown("unhandledRejection", 1);
});

startServer().catch(async (error) => {
  logger.error("Failed to start server", error);
  await disconnectDatabase();
  process.exit(1);
});
