import { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService";

export class DashboardController {
  async handle(req: Request, res: Response) {
    const service = new DashboardService();

    try {
      const result = await service.execute();
      return res.json(result);
    } catch (error) {
      console.error("Dashboard Error:", error);
      return res.status(500).json({ error: "Erro ao buscar dados do dashboard" });
    }
  }
}