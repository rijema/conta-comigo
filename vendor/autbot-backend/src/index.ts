import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';

// Importação do Prisma 
import prisma from './prisma';

// Importação das Rotas
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import authRouter from './routes/authRoutes';
import faqRoutes from './routes/faqRoutes';
import lembreteRoutes from './routes/lembretes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { professionalRoutes } from './routes/professional.routes'; 

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swaggerConfig';

import { ChatController } from './controllers/chatController';
import { LembreteController } from './controllers/lembreteController'; 

dotenv.config();

const app = express();

// Conexão com o Banco
prisma.$connect()
  .then(() => console.log('Conectado ao PostgreSQL via Prisma!'))
  .catch((err: any) => console.error('Erro na conexão Prisma → PostgreSQL:', err));

// Configuração de CORS e JSON
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// --- Definição das Rotas ---
app.use('/api', userRoutes);
app.use('/api', chatRoutes);
app.use('/api', authRouter);
app.use('/api', faqRoutes);
app.use('/api/lembretes', lembreteRoutes);

// Rota do Dashboard
app.use('/api/dashboard', dashboardRoutes); 

// Rota de Profissionais
app.use('/api/profissionais', professionalRoutes); 

// Documentação Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Arquivos estáticos
app.use(express.static('src/websocket'));

// Configuração do Servidor e WebSocket
const server = http.createServer(app);
new ChatController(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Encerramento gracioso (Graceful Shutdown)
process.on('SIGINT', async () => {
  console.log("O servidor está sendo encerrado. As conversas estão sendo terminadas.");
  await prisma.historic.updateMany({
    where: { terminated: false },
    data: {
      terminated: true,
      endedAt: new Date(),
    },
  });
  process.exit(0);
});