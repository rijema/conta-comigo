/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Operações relacionadas ao chat e histórico de conversas
 */

/**
 * @swagger
 * /chat/history/{userId}:
 *   get:
 *     summary: Busca o histórico de chat de um usuário específico
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário para buscar o histórico
 *     responses:
 *       200:
 *         description: Histórico encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   historicId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   endedAt:
 *                     type: string
 *                     format: date-time
 *                   terminated:
 *                     type: boolean
 *                   messages:
 *                     type: array
 *                     description: Lista de mensagens do histórico
 *                   summary:
 *                     type: object
 *                     description: Resumo do histórico
 *       404:
 *         description: Nenhum histórico encontrado para este usuário
 *       500:
 *         description: Erro interno do servidor
 */

import express, { Request, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middlewares/authMiddleware';

const chatRoutes = express.Router();

chatRoutes.get('/chat/history/:userId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const historics = await prisma.historic.findMany({
      where: {
        userId: userId
      },
      include: {
        messages: true,
        summary: true, 
      },
      orderBy: {
        startedAt: 'desc', 
      },
    });

    if (historics.length === 0) {
      res.status(404).json({ error: 'Nenhum histórico encontrado para este usuário.' });
      return;
    }

    res.status(200).json(historics);

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

export default chatRoutes;
