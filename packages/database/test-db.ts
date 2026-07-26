import { prisma } from "./src/index";

async function main() {
  try {
    const activeCustomers = await prisma.customer.count();
    console.log("Connected successfully! Active customers:", activeCustomers);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
