import { Router } from 'express';
import { LembreteController } from '../controllers/lembreteController'; 

const router = Router();

// 1. GET /api/lembretes
// (Corresponde ao useEffect no frontend)
router.get('/', LembreteController.buscarTodos);

// 2. POST /api/lembretes
// (Corresponde ao handleAdicionarLembrete no frontend)
router.post('/', LembreteController.criarLembrete);

// 3. DELETE /api/lembretes/:id
// (Corresponde ao handleRemoverLembrete no frontend)
router.delete('/:id', LembreteController.removerLembrete);

export default router;