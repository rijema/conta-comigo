import { Request, Response } from "express";
import { OSMService } from "../services/OSMService";

export class ProfessionalController {
  async handle(req: Request, res: Response) {
    // Extraí os parâmetros da query string
    const { cidade, estado, especialidade } = req.query;

    // Validação básica: Cidade e Estado são obrigatórios para saber onde buscar no mapa
    if (!cidade || !estado) {
      return res.status(400).json({ error: "Cidade e Estado são obrigatórios." });
    }

    // Instancia o serviço do OpenStreetMap
    const service = new OSMService();

    try {
      const result = await service.execute({
        cidade: String(cidade),
        estado: String(estado),
        especialidade: especialidade ? String(especialidade) : undefined,
      });

      return res.json(result);
    } catch (error) {
      console.error("Erro no controlador:", error);
      return res.status(500).json({ error: "Erro ao buscar profissionais." });
    }
  }
}