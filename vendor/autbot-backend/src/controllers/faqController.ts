import { Request, Response } from 'express';
import { fetchFrequentQuestions } from '../services/chat/faqService';

export async function getFrequentQuestions(req: Request, res: Response) {
  try {
    const questions = await fetchFrequentQuestions(7); 
    res.json(questions);
  } catch (error) {
    console.error('Erro ao buscar perguntas frequentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
