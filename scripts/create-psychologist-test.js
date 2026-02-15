const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPsychologistTest() {
    console.log('🧠 CRIANDO CENÁRIO DE TESTE - PSYCHOLOGIST\n');
    console.log('='.repeat(80));

    try {
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) throw new Error('Nenhum tenant encontrado');

        console.log(`✅ Tenant: ${tenant.name}`);

        let psychologist = await prisma.user.findFirst({
            where: { tenantId: tenant.id, role: 'PSYCHOLOGIST' }
        });

        if (psychologist) {
            console.log(`\n✅ Psicólogo já existe: ${psychologist.name} (${psychologist.email})`);
        } else {
            console.log('\n⚠️  Criando psicólogo de teste...');
            psychologist = await prisma.user.create({
                data: {
                    tenantId: tenant.id,
                    email: 'psicologo@escola.com',
                    cpf: '98765432100',
                    name: 'Dra. Ana Paula Silva',
                    role: 'PSYCHOLOGIST',
                    isActive: true
                }
            });
            console.log(`✅ Psicólogo criado: ${psychologist.name}`);
        }

        const totalStudents = await prisma.student.count({
            where: { tenantId: tenant.id, isActive: true }
        });

        const totalAssessments = await prisma.assessment.count({
            where: { tenantId: tenant.id }
        });

        console.log('\n📊 ESTATÍSTICAS DO SISTEMA:');
        console.log('-'.repeat(80));
        console.log(`  Total de alunos:           ${totalStudents}`);
        console.log(`  Total de avaliações:       ${totalAssessments}`);

        console.log('\n✅ CREDENCIAIS DO PSICÓLOGO:');
        console.log('-'.repeat(80));
        console.log(`  Email:    ${psychologist.email}`);
        console.log(`  Nome:     ${psychologist.name}`);
        console.log(`  Role:     ${psychologist.role}`);

        console.log('\n📋 ACESSO ESPERADO (PSYCHOLOGIST):');
        console.log('-'.repeat(80));
        console.log('  ✅ Ver TODOS os ${totalStudents} alunos (sem filtro de turma)');
        console.log('  ✅ Ver todas as triagens/avaliações');
        console.log('  ✅ Criar planos de intervenção');
        console.log('  ✅ Ver casos de risco (TIER 2 e TIER 3)');
        console.log('  ✅ Gerar relatórios');
        console.log('  ❌ Criar/editar turmas');
        console.log('  ❌ Gerenciar matrículas de alunos');

        console.log('\n🧪 TESTE RÁPIDO:');
        console.log('-'.repeat(80));
        console.log(`  1. Login: ${psychologist.email}`);
        console.log('  2. Navegar para /turma');
        console.log(`  3. Deve ver TODOS os ${totalStudents} alunos (não filtrado)`);
        console.log('  4. Navegar para /turmas');
        console.log('  5. NÃO deve ver botão "Nova Turma"');
        console.log('  6. NÃO deve ver botão "Gerenciar Alunos"');

        console.log('\n' + '='.repeat(80));
        console.log('✅ CENÁRIO PRONTO!\n');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createPsychologistTest()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
