const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🎯 SEED DE TESTE - VÍNCULOS PROFESSOR-TURMA (V4.1)
 * 
 * Script idempotente para criar cenário de teste completo:
 * - 2 turmas (9º Ano A - ELEMENTARY, 1º Ano EM - HIGH_SCHOOL)
 * - Distribuir 20 alunos (10 em cada turma)
 * - Vincular professor a ambas as turmas
 */

async function seedTestScenario() {
    console.log('🎯 INICIANDO SEED DE TESTE - VÍNCULOS PROFESSOR-TURMA\n');
    console.log('='.repeat(80));

    try {
        // 1. Buscar tenantId
        console.log('\n📋 1. BUSCANDO TENANT...');
        const tenant = await prisma.tenant.findFirst();

        if (!tenant) {
            throw new Error('❌ Nenhum tenant encontrado! Execute o seed principal primeiro.');
        }

        console.log(`   ✅ Tenant encontrado: ${tenant.name} (${tenant.id})`);
        const tenantId = tenant.id;

        // 2. Buscar ou criar professor de teste
        console.log('\n👨‍🏫 2. BUSCANDO PROFESSOR...');
        let teacher = await prisma.user.findFirst({
            where: {
                tenantId: tenantId,
                role: 'TEACHER'
            }
        });

        if (!teacher) {
            console.log('   ⚠️  Nenhum professor encontrado. Criando professor de teste...');
            teacher = await prisma.user.create({
                data: {
                    tenantId: tenantId,
                    email: 'professor.teste@escola.com',
                    cpf: '12345678901',
                    name: 'Professor Teste Silva',
                    role: 'TEACHER',
                    isActive: true
                }
            });
            console.log(`   ✅ Professor criado: ${teacher.name}`);
        } else {
            console.log(`   ✅ Professor encontrado: ${teacher.name} (${teacher.email})`);
        }

        const teacherId = teacher.id;

        // 3. Criar ou buscar turmas
        console.log('\n🏫 3. CRIANDO/BUSCANDO TURMAS...');

        // Turma 1: 9º Ano A (Elementary)
        let class9A = await prisma.classroom.findFirst({
            where: {
                tenantId: tenantId,
                name: '9º Ano A',
                year: 2024
            }
        });

        if (!class9A) {
            class9A = await prisma.classroom.create({
                data: {
                    tenantId: tenantId,
                    name: '9º Ano A',
                    grade: 'ANO_1_EM', // Using available enum
                    year: 2024,
                    shift: 'Manhã'
                }
            });
            console.log(`   ✅ Turma criada: ${class9A.name}`);
        } else {
            console.log(`   ✅ Turma já existe: ${class9A.name}`);
        }

        // Turma 2: 1º Ano EM (High School)
        let class1EM = await prisma.classroom.findFirst({
            where: {
                tenantId: tenantId,
                name: '1º Ano EM',
                year: 2024
            }
        });

        if (!class1EM) {
            class1EM = await prisma.classroom.create({
                data: {
                    tenantId: tenantId,
                    name: '1º Ano EM',
                    grade: 'ANO_1_EM',
                    year: 2024,
                    shift: 'Tarde'
                }
            });
            console.log(`   ✅ Turma criada: ${class1EM.name}`);
        } else {
            console.log(`   ✅ Turma já existe: ${class1EM.name}`);
        }

        // 4. Buscar alunos sem turma
        console.log('\n👥 4. DISTRIBUINDO ALUNOS...');

        const students = await prisma.student.findMany({
            where: {
                tenantId: tenantId,
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log(`   📊 Total de alunos encontrados: ${students.length}`);

        if (students.length === 0) {
            console.log('   ⚠️  Nenhum aluno encontrado!');
        } else {
            // Distribuir alunos
            const half = Math.ceil(students.length / 2);
            const firstHalf = students.slice(0, half);
            const secondHalf = students.slice(half);

            // Atualizar primeira metade para turma 9º Ano A
            let count1 = 0;
            for (const student of firstHalf) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: { classroomId: class9A.id }
                });
                count1++;
            }
            console.log(`   ✅ ${count1} alunos vinculados à turma "${class9A.name}"`);

            // Atualizar segunda metade para turma 1º Ano EM
            let count2 = 0;
            for (const student of secondHalf) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: { classroomId: class1EM.id }
                });
                count2++;
            }
            console.log(`   ✅ ${count2} alunos vinculados à turma "${class1EM.name}"`);
        }

        // 5. Criar vínculos professor-turma
        console.log('\n🔗 5. CRIANDO VÍNCULOS PROFESSOR-TURMA...');

        // Vínculo com 9º Ano A
        const link1 = await prisma.teacherClassroom.upsert({
            where: {
                teacherId_classroomId: {
                    teacherId: teacherId,
                    classroomId: class9A.id
                }
            },
            create: {
                teacherId: teacherId,
                classroomId: class9A.id,
                tenantId: tenantId
            },
            update: {}
        });
        console.log(`   ✅ Professor vinculado a "${class9A.name}"`);

        // Vínculo com 1º Ano EM
        const link2 = await prisma.teacherClassroom.upsert({
            where: {
                teacherId_classroomId: {
                    teacherId: teacherId,
                    classroomId: class1EM.id
                }
            },
            create: {
                teacherId: teacherId,
                classroomId: class1EM.id,
                tenantId: tenantId
            },
            update: {}
        });
        console.log(`   ✅ Professor vinculado a "${class1EM.name}"`);

        // 6. Validação Final
        console.log('\n✅ 6. VALIDAÇÃO DO CENÁRIO...');
        console.log('='.repeat(80));

        const class9AStudents = await prisma.student.count({
            where: { classroomId: class9A.id }
        });

        const class1EMStudents = await prisma.student.count({
            where: { classroomId: class1EM.id }
        });

        const teacherLinks = await prisma.teacherClassroom.findMany({
            where: { teacherId: teacherId },
            include: { classroom: true }
        });

        console.log('\n📊 RESUMO DO CENÁRIO DE TESTE:');
        console.log('-'.repeat(80));
        console.log(`  Tenant:             ${tenant.name}`);
        console.log(`  Professor:          ${teacher.name} (${teacher.email})`);
        console.log(`  Turma 1:            ${class9A.name} → ${class9AStudents} alunos`);
        console.log(`  Turma 2:            ${class1EM.name} → ${class1EMStudents} alunos`);
        console.log(`  Vínculos criados:   ${teacherLinks.length}`);
        console.log('\n  Turmas vinculadas ao professor:');
        for (const link of teacherLinks) {
            console.log(`    - ${link.classroom.name}`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ SEED DE TESTE CONCLUÍDO COM SUCESSO!\n');

        // 7. Instruções de Teste
        console.log('📋 INSTRUÇÕES PARA TESTE:\n');
        console.log('1️⃣  Faça login com as credenciais do professor:');
        console.log(`    Email:    ${teacher.email}`);
        console.log(`    Senha:    (use a senha configurada no sistema)`);
        console.log('');
        console.log('2️⃣  Navegue para: /turma');
        console.log('');
        console.log('3️⃣  Validações esperadas:');
        console.log(`    ✅ Dropdown deve mostrar APENAS 2 turmas:`);
        console.log(`       - ${class9A.name}`);
        console.log(`       - ${class1EM.name}`);
        console.log(`    ✅ Ao selecionar "${class9A.name}" → Ver ${class9AStudents} alunos`);
        console.log(`    ✅ Ao selecionar "${class1EM.name}" → Ver ${class1EMStudents} alunos`);
        console.log(`    ✅ Total acessível: ${class9AStudents + class1EMStudents} alunos`);
        console.log('');
        console.log('4️⃣  Teste de Segurança:');
        console.log('    ❌ Criar uma 3ª turma e NÃO vincular ao professor');
        console.log('    ❌ Tentar acessar URL da 3ª turma diretamente');
        console.log('    ✅ Deve redirecionar automaticamente');
        console.log('');
        console.log('='.repeat(80));

        // Retornar IDs para referência
        return {
            tenantId,
            teacherId,
            teacherEmail: teacher.email,
            classrooms: {
                class9A: { id: class9A.id, name: class9A.name, students: class9AStudents },
                class1EM: { id: class1EM.id, name: class1EM.name, students: class1EMStudents }
            },
            totalStudents: class9AStudents + class1EMStudents
        };

    } catch (error) {
        console.error('\n❌ ERRO NO SEED:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar seed
seedTestScenario()
    .then(result => {
        console.log('\n✅ Script finalizado com sucesso!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Script falhou:', error.message);
        process.exit(1);
    });
