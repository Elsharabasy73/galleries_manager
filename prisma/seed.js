const seed = async () => {
  console.log("No seed data is defined yet.");
};

seed().catch((error) => {
  console.error("Database seed failed", error);
  process.exit(1);
});
