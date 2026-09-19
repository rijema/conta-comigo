/**
 * @swagger
 * /faq:
 *   get:
 *     summary: Retorna as 7 perguntas mais frequentes
 *     tags: [FAQ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista das perguntas frequentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   question:
 *                     type: string
 *                   count:
 *                     type: integer
 *       401:
 *         description: Não autorizado (token ausente ou inválido)
 *       500:
 *         description: Erro interno do servidor
 */

import { Router } from 'express';
import { getFrequentQuestions } from '../controllers/faqController';
import { authMiddleware } from '../middlewares/authMiddleware';

const faqRoutes = Router();

faqRoutes.get('/faq', authMiddleware, getFrequentQuestions);

export default faqRoutes;
