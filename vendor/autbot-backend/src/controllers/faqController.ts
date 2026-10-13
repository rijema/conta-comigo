import { Request, Response } from 'express';
import { fetchFrequentQuestions } from '../services/chat/faqService';

interface IRequest extends Request {
  user?: any;
}

export async function getFrequentQuestions(req: IRequest, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const questions = await fetchFrequentQuestions(req.user.id, 7);
    res.json(questions);
  } catch (error) {
    console.error('Erro ao buscar perguntas frequentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
