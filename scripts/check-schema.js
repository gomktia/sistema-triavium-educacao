
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
    try {
        console.log("Checking database connection...");
        // Try to query the table directly to see columns (Postgres specific)
        const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'form_questions';
    `;
        console.log("Columns in form_questions:", result);
    } catch (e) {
        console.error("Error querying schema:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchema();
