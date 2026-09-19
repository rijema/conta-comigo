import { Request, Response, RequestHandler } from 'express';
import prisma from '../prisma';

export const LembreteController = {
  buscarTodos: (async (req, res) => {
    try {
      const lembretes = await prisma.lembrete.findMany({ orderBy: { data: 'desc' } });
      res.status(200).json(lembretes);
    } catch (err) {
      console.error('Erro ao buscar lembretes:', err);
      res.status(500).json({ error: 'Erro interno ao buscar lembretes.' });
    }
  }) as RequestHandler,

  criarLembrete: (async (req, res) => {
    try {
      const { titulo, descricao, data, horaInicio, horaFim } = req.body;
      if (!titulo || !data) return res.status(400).json({ error: 'Título e Data são obrigatórios.' });

      const novoLembrete = await prisma.lembrete.create({
        data: { titulo, descricao, data: new Date(data), horaInicio, horaFim },
      });
      res.status(201).json(novoLembrete);
    } catch (err) {
      console.error('Erro ao criar lembrete:', err);
      res.status(500).json({ error: 'Erro interno ao criar lembrete.' });
    }
  }) as RequestHandler,

  removerLembrete: (async (req, res) => {
    try {
      const lembreteId = Number(req.params.id);
      const lembrete = await prisma.lembrete.findUnique({ where: { id: lembreteId } });
      if (!lembrete) return res.status(404).json({ error: 'Lembrete não encontrado.' });

      await prisma.lembrete.delete({ where: { id: lembreteId } });
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao remover lembrete:', err);
      res.status(500).json({ error: 'Erro interno ao remover lembrete.' });
    }
  }) as RequestHandler,
};
