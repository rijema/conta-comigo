import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();
const CONTA_COMIGO_PROVIDER = 'conta-comigo';

interface ContaComigoBootstrapPayload {
    sub: string;
    email: string;
    name: string;
    role: string;
    iat?: number;
    exp?: number;
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

function mapContaComigoRoleToUserType(role: string) {
    switch (role) {
        case 'professional':
            return 'PROFESSOR' as const;
        case 'guardian':
            return 'RESPONSAVEL' as const;
        case 'child':
            return 'USUARIO' as const;
        default:
            return 'USUARIO' as const;
    }
}

export const exchangeContaComigoToken = async (token: string) => {
    const bridgeSecret = process.env.CONTA_COMIGO_SHARED_SECRET;

    if (!bridgeSecret) {
        throw new Error('CONTA_COMIGO_SHARED_SECRET não está definida nas variáveis de ambiente.');
    }

    const decoded = jwt.verify(token, bridgeSecret) as ContaComigoBootstrapPayload;

    if (!decoded.sub || !decoded.email || !decoded.name) {
        throw new Error('Token do Conta Comigo inválido.');
    }

    const userType = mapContaComigoRoleToUserType(decoded.role);
    const syntheticPassword = await bcrypt.hash(`${CONTA_COMIGO_PROVIDER}:${decoded.sub}`, 10);
    const placeholderBirthDate = new Date('2000-01-01T00:00:00.000Z');

    const user = await prisma.user.upsert({
        where: { externalAuthId: decoded.sub },
        update: {
            email: decoded.email,
            name: decoded.name,
            userType,
            externalAuthProvider: CONTA_COMIGO_PROVIDER,
            externalMetadata: {
                role: decoded.role,
                source: CONTA_COMIGO_PROVIDER,
            },
        },
        create: {
            email: decoded.email,
            name: decoded.name,
            password: syntheticPassword,
            birthDate: placeholderBirthDate,
            userType,
            dataConsent: true,
            externalAuthProvider: CONTA_COMIGO_PROVIDER,
            externalAuthId: decoded.sub,
            externalMetadata: {
                role: decoded.role,
                source: CONTA_COMIGO_PROVIDER,
            },
        },
    });

    const appSecret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '3600';

    if (!appSecret) {
        throw new Error('JWT_SECRET não está definida nas variáveis de ambiente.');
    }

    const authToken = jwt.sign(
        { userId: user.id, email: user.email, role: decoded.role, source: CONTA_COMIGO_PROVIDER },
        appSecret,
        { expiresIn: Number.parseInt(expiresIn, 10) }
    );

    return {
        token: authToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType,
            externalAuthProvider: user.externalAuthProvider,
        },
    };
};

export const requestPasswordReset = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log(`Solicitação de reset para e-mail não cadastrado: ${email}`);
        return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
        where: { email },
        data: {
            resetPasswordToken: resetToken,
            resetPasswordTokenExpiry: tokenExpiry,
        },
    });

    const resetUrl = `${process.env.CLIENTE_URL}/alterar-senha/${resetToken}`;
    
    const mailOptions = {
        from: `ChatBot Acessível <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: 'Instruções para Redefinição de Senha',
        text: `Olá, ${user.name}!\n\nVocê solicitou a redefinição da sua senha. Por favor, clique no link a seguir ou cole no seu navegador para completar o processo:\n\n${resetUrl}\n\nSe você não solicitou isso, por favor, ignore este e-mail. Este link é válido por 1 hora.\n`,
    };

    await transporter.sendMail(mailOptions);
};

export const resetPassword = async (token: string, newPassword: string) => {
    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordTokenExpiry: {
                gte: new Date(),
            },
        },
    });

    if (!user) {
        throw new Error('O token para redefinição de senha é inválido ou expirou.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordTokenExpiry: null,
        },
    });
};
