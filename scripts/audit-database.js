const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditDatabase() {
    console.log('🔍 AUDITORIA DO BANCO DE DADOS SUPABASE\n');
    console.log('Data:', new Date().toLocaleString('pt-BR'));
    console.log('='.repeat(80));

    try {
        // Query para listar todas as tabelas
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        console.log('\n📊 TABELAS ENCONTRADAS NO BANCO:', tables.length);
        console.log('-'.repeat(80));

        for (const table of tables) {
            console.log(`  ✓ ${table.table_name}`);
        }

        // Query para contar registros em cada tabela
        console.log('\n📈 CONTAGEM DE REGISTROS POR TABELA:');
        console.log('-'.repeat(80));

        for (const table of tables) {
            try {
                const count = await prisma.$queryRawUnsafe(
                    `SELECT COUNT(*) as count FROM "${table.table_name}"`
                );
                console.log(`  ${table.table_name.padEnd(30)} → ${count[0].count} registros`);
            } catch (error) {
                console.log(`  ${table.table_name.padEnd(30)} → Erro ao contar`);
            }
        }

        // Verificar tabela teacher_classrooms especificamente
        console.log('\n🎓 VERIFICAÇÃO ESPECÍFICA: teacher_classrooms');
        console.log('-'.repeat(80));

        const teacherClassroomsExists = tables.some(t => t.table_name === 'teacher_classrooms');

        if (teacherClassroomsExists) {
            console.log('  ✅ Tabela teacher_classrooms EXISTE');

            // Verificar colunas
            const columns = await prisma.$queryRaw`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'teacher_classrooms'
                ORDER BY ordinal_position;
            `;

            console.log('\n  Colunas encontradas:');
            for (const col of columns) {
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                console.log(`    - ${col.column_name.padEnd(15)} ${col.data_type.padEnd(20)} ${nullable}`);
            }

            // Verificar índices
            const indexes = await prisma.$queryRaw`
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = 'teacher_classrooms';
            `;

            console.log('\n  Índices encontrados:');
            for (const idx of indexes) {
                console.log(`    - ${idx.indexname}`);
            }

            // Verificar constraints
            const constraints = await prisma.$queryRaw`
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints
                WHERE table_name = 'teacher_classrooms';
            `;

            console.log('\n  Constraints encontradas:');
            for (const con of constraints) {
                console.log(`    - ${con.constraint_name.padEnd(40)} (${con.constraint_type})`);
            }

        } else {
            console.log('  ❌ Tabela teacher_classrooms NÃO EXISTE');
        }

        // Verificar enums
        console.log('\n🏷️  VERIFICAÇÃO DE ENUMS:');
        console.log('-'.repeat(80));

        const enums = await prisma.$queryRaw`
            SELECT typname 
            FROM pg_type 
            WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND typtype = 'e'
            ORDER BY typname;
        `;

        for (const enumType of enums) {
            console.log(`  ✓ ${enumType.typname}`);

            // Listar valores do enum
            const enumValues = await prisma.$queryRaw`
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (
                    SELECT oid FROM pg_type WHERE typname = ${enumType.typname}
                )
                ORDER BY enumsortorder;
            `;

            const values = enumValues.map(v => v.enumlabel).join(', ');
            console.log(`    Valores: ${values}`);
        }

        // Verificar tabelas esperadas do schema
        console.log('\n✅ VERIFICAÇÃO DE TABELAS ESPERADAS:');
        console.log('-'.repeat(80));

        const expectedTables = [
            'tenants',
            'users',
            'students',
            'classrooms',
            'teacher_classrooms', // Nova tabela
            'assessments',
            'assessment_answers',
            'form_questions',
            'intervention_plans',
            'intervention_logs',
            'intervention_groups',
            'notifications',
            'school_indicators',
            'audit_logs',
            'student_invitations'
        ];

        const tableNames = tables.map(t => t.table_name);

        for (const expectedTable of expectedTables) {
            const exists = tableNames.includes(expectedTable);
            const icon = exists ? '✅' : '❌';
            console.log(`  ${icon} ${expectedTable.padEnd(30)} ${exists ? 'EXISTE' : 'FALTANDO'}`);
        }

        // Tabelas extras (não esperadas)
        const extraTables = tableNames.filter(t => !expectedTables.includes(t));
        if (extraTables.length > 0) {
            console.log('\n⚠️  TABELAS EXTRAS (não no schema):');
            console.log('-'.repeat(80));
            for (const extra of extraTables) {
                console.log(`  ⚠️  ${extra}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ AUDITORIA CONCLUÍDA\n');

    } catch (error) {
        console.error('❌ Erro na auditoria:', error);
    } finally {
        await prisma.$disconnect();
    }
}

auditDatabase();
