import prisma from "../prisma"; 
import { DashboardDTO } from "../dtos/DashboardDTO";

export class DashboardService {
  async execute(): Promise<DashboardDTO> {
    // Total de Usuários (name: totalUsuarios)
    const totalUsuarios = await prisma.user.count();

    // Total de Conversas/Históricos (name: totalChats)
    const totalChats = await prisma.historic.count();

    // Total de Mensagens (name: mensagensEnviadas)
    const mensagensEnviadas = await prisma.message.count();

    // Usuários Ativos Hoje
    // Lógica: Conta quantos usuários únicos iniciaram uma conversa hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera o horário para pegar desde o início do dia

    const activeUsersGroup = await prisma.historic.groupBy({
      by: ['userId'],
      where: {
        startedAt: {
          gte: today, // Maior ou igual a hoje 00:00
        },
      },
    });
    
    const usuariosAtivosHoje = activeUsersGroup.length;

    // RETORNO NO FORMATO EXATO PARA FRONTEND
    return {
      totalUsuarios,
      totalChats,
      mensagensEnviadas,
      usuariosAtivosHoje,
    };
  }
}