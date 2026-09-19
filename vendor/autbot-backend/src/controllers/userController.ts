import { NextFunction, Request, Response } from "express";
import { CreateUserDTO } from "../dtos/createUserDTO";
import { UserType } from "@prisma/client";
import prisma from "../prisma";
import { LoginDTO } from "../dtos/loginDTO"; 
import bcrypt from "bcryptjs";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export class UserController {
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: LoginDTO = req.body;

      const user = await prisma.user.findUnique({ where: { email: data.email } });

      if (!user) {
        res.status(404).json({ message: "Usuário não encontrado" });
        return;
      }

      if (!user.password) {
        res
          .status(400)
          .json({ message: "Senha não encontrada para o usuário" });
        return;
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password
      );

      if (!isPasswordValid) {
        res.status(401).json({ message: "Senha inválida" });
        return;
      }

      const secret: string = process.env.JWT_SECRET!;
      const expiresIn: number = parseInt(
        process.env.JWT_EXPIRES_IN || "3600",
        10
      );

      if (!secret) {
        res
          .status(500)
          .json({ message: "Chave secreta JWT não configurada corretamente" });
        return;
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
        expiresIn,
      });

      res.json({
        message: "Login realizado com sucesso",
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      console.log(data);
      const userDTO = plainToClass(CreateUserDTO, data);

      const errors = await validate(userDTO);
      if (errors.length > 0) {
        const errorMessages = errors.flatMap((error) =>
          error.constraints ? Object.values(error.constraints) : []
        );
        res
          .status(400)
          .json({ message: "Erros de validação", errors: errorMessages });
        return;
      }

      const existingUser = await prisma.user.findUnique({ where: { email: userDTO.email} });
      if (existingUser) {
        res.status(400).json({ message: "Email já cadastrado" });
        return;
      }

      const hashedPassword = await bcrypt.hash(userDTO.password!, 10);

      const formattedBirthDate = new Date(userDTO.birthDate!.split('-').reverse().join('-'));

      const newUser = await prisma.user.create({
        data: {
          name: userDTO.name!,
          email: userDTO.email!,
          password: hashedPassword,
          birthDate: formattedBirthDate,
          userType: userDTO.userType as UserType,
          dataConsent: userDTO.dataConsent
        },

      });

      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar usuário", error });
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários", error });
    }
  }

  static async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;

      const user = await prisma.user.findUnique({ where: {id: userId}}
      );

      if (!user) {
        res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário", error });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, userType } = req.body;

      const user = await prisma.user.findUnique({where: {id: id}});

      if (!user) {
        res.status(404).json({ message: "Usuário não encontrado" });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(userType && { userType }),
        },
    });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário", error });
    }
  }
}