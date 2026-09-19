import { Router } from "express";
import { AuthController } from "../controllers/authController";

const authRouter = Router();

authRouter.post("/auth/exchange/conta-comigo", AuthController.exchangeContaComigo);
authRouter.post("/forgot-password", AuthController.forgotPassword);
authRouter.post("/reset-password/:token", AuthController.resetPassword);

export default authRouter;