const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectAssessments() {
    console.log('🔍 INSPEÇÃO DETALHADA: TABELA ASSESSMENTS\n');
    console.log('='.repeat(80));

    try {
        // Ver estrutura da tabela
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'assessments'
            ORDER BY ordinal_position;
        `;

        console.log('\n📋 COLUNAS DA TABELA assessments:');
        console.log('-'.repeat(80));
        for (const col of columns) {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const maxLen = col.character_maximum_length || '';
            console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable.padEnd(10)} ${maxLen}`);
        }

        // Pegar uma amostra de dados
        console.log('\n📊 AMOSTRA DE DADOS (primeiros 3 registros):');
        console.log('-'.repeat(80));

        const samples = await prisma.assessment.findMany({
            take: 3,
            select: {
                id: true,
                type: true,
                studentId: true,
                createdAt: true,
            }
        });

        for (const sample of samples) {
            console.log(`\nID: ${sample.id}`);
            console.log(`  Tipo: ${sample.type}`);
            console.log(`  Aluno: ${sample.studentId}`);
            console.log(`  Criado: ${sample.createdAt}`);
        }

        // Ver se há campo JSON para respostas
        console.log('\n🔎 PROCURANDO CAMPO DE RESPOSTAS...');
        console.log('-'.repeat(80));

        const jsonColumn = columns.find(col =>
            col.data_type === 'jsonb' ||
            col.data_type === 'json' ||
            col.column_name.toLowerCase().includes('answer') ||
            col.column_name.toLowerCase().includes('response') ||
            col.column_name.toLowerCase().includes('data')
        );

        if (jsonColumn) {
            console.log(`✅ Encontrado: ${jsonColumn.column_name} (${jsonColumn.data_type})`);
            console.log('   Respostas provavelmente armazenadas neste campo');
        } else {
            console.log('❌ Nenhum campo JSON/answer encontrado');
            console.log('   Respostas podem estar em tabela separada (assessment_answers)');
        }

        // Verificar relacionamentos
        console.log('\n🔗 FOREIGN KEYS DA TABELA assessments:');
        console.log('-'.repeat(80));

        const fks = await prisma.$queryRaw`
            SELECT
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'assessments';
        `;

        for (const fk of fks) {
            console.log(`  ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ INSPEÇÃO CONCLUÍDA\n');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

inspectAssessments();
