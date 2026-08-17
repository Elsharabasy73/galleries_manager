const { PrismaPg } = require("@prisma/adapter-pg");

const { getEnvironment } = require("./env");

let prisma;

const getPrisma = () => {
  if (!prisma) {
    const { PrismaClient } = require("@prisma/client");
    const adapter = new PrismaPg({
      connectionString: getEnvironment().databaseUrl,
    });

    prisma = new PrismaClient({ adapter });
  }

  return prisma;
};

const connectDatabase = async () => {
  await getPrisma().$connect();
};

const disconnectDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getPrisma,
};
