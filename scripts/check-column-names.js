const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showTableStructure() {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA teacher_classrooms\n');

    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'teacher_classrooms'
            ORDER BY ordinal_position;
        `;

        console.log('📋 COLUNAS DA TABELA:');
        console.log('-'.repeat(50));
        for (const col of columns) {
            console.log(`  ${col.column_name.padEnd(20)} (${col.data_type})`);
        }

        console.log('\n✅ QUERY SQL CORRETA PARA COPIAR:\n');
        console.log('-'.repeat(80));
        console.log(`
SELECT 
    u.name AS professor,
    c.name AS turma,
    (SELECT COUNT(*) FROM students WHERE "classroomId" = c.id) AS alunos
FROM teacher_classrooms tc
JOIN users u ON tc."teacherId" = u.id
JOIN classrooms c ON tc."classroomId" = c.id
WHERE u.email = 'professor@escola.com'
ORDER BY c.name;
        `);
        console.log('-'.repeat(80));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

showTableStructure();
