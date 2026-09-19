import { Router } from "express";
import { ProfessionalController } from "../controllers/ProfessionalController";

const professionalRoutes = Router();
const controller = new ProfessionalController();

// Define a rota GET /buscar
professionalRoutes.get("/buscar", controller.handle);

export { professionalRoutes };