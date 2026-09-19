import { PrismaClient, UserType, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Teste Banco de dados...');

  //  Limpar dados antigos (para não duplicar)
  // A ordem importa por causa das chaves estrangeiras (deletar filhos antes dos pais)
  await prisma.message.deleteMany();
  await prisma.conversationSummary.deleteMany();
  await prisma.historic.deleteMany();
  await prisma.chatCache.deleteMany();
  await prisma.frequentQuestion.deleteMany();
  await prisma.user.deleteMany();

  console.log('Banco limpo.');

  //  Criar Perguntas Frequentes
  await prisma.frequentQuestion.createMany({
    data: [
      { question: "Como resetar minha senha?", count: 45 },
      { question: "O que é o autismo nível 1?", count: 120 },
      { question: "Como cadastrar um aluno?", count: 30 },
      { question: "O bot funciona offline?", count: 15 },
      { question: "Contato do suporte", count: 80 },
    ]
  });

  // Criar Usuários (50 usuários variados)
  const userTypes = [
    UserType.PROFESSOR, 
    UserType.CUIDADOR, 
    UserType.RESPONSAVEL, 
    UserType.TEA_NIVEL_1,
    UserType.TEA_NIVEL_2
  ];

  const usersIds: string[] = [];

  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: "senha_segura_123", 
        birthDate: faker.date.birthdate(),
        userType: faker.helpers.arrayElement(userTypes),
        dataConsent: true,
      }
    });
    usersIds.push(user.id);
  }

  console.log(`50 Usuários criados.`);

  // Cria Históricos de Conversa (Simulando os últimos 10 dias)
  for (let i = 0; i < 100; i++) {
    const randomUser = faker.helpers.arrayElement(usersIds);
    
    // Gera uma data aleatória nos últimos 10 dias
    const startedAt = faker.date.recent({ days: 10 });
    const endedAt = new Date(startedAt.getTime() + 1000 * 60 * 15); // +15 minutos depois

    const historic = await prisma.historic.create({
      data: {
        userId: randomUser,
        startedAt: startedAt,
        endedAt: endedAt,
        terminated: true,
      }
    });

    // Cria Mensagens para esse histórico
    // Cria entre 2 e 6 mensagens por conversa
    const numMessages = faker.number.int({ min: 2, max: 6 });
    
    for (let j = 0; j < numMessages; j++) {
      await prisma.message.create({
        data: {
          historicId: historic.historicId,
          role: j % 2 === 0 ? Role.user : Role.assistant, // Alterna entre usuário e bot
          content: faker.lorem.sentence(),
          createdAt: new Date(startedAt.getTime() + (j * 1000 * 60)), // 1 min entre msgs
        }
      });
    }
  }

const especialidades = [
    "Psicólogo Infantil",
    "Fonoaudiólogo",
    "Terapeuta Ocupacional",
    "Neurologista",
    "Psicopedagogo"
  ];

  const cidades = [
    { city: "Recife", state: "PE" },
    { city: "São Paulo", state: "SP" },
    { city: "Rio de Janeiro", state: "RJ" }
  ];

  // Criar 30 profissionais
  for (let i = 0; i < 30; i++) {
    const local = faker.helpers.arrayElement(cidades);
    
    await prisma.professional.create({
      data: {
        name: faker.person.fullName(), // ou faker.name.fullName() dependendo da versão
        specialty: faker.helpers.arrayElement(especialidades),
        address: faker.location.streetAddress(),
        city: local.city,
        state: local.state,
        phone: faker.phone.number(), // Gera número aleatório
      }
    });
  }

  console.log(' Profissionais criados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });