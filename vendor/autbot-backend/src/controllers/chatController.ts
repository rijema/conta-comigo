import { WebSocketServer, WebSocket, Data } from "ws";
import { handleChatMessage } from "../services/chat/chatHandler";
import prisma from "../prisma";
import { PublicoKey } from "../services/chat/chatService";
import jwt from 'jsonwebtoken';
import { IncomingMessage } from "http";
import { Socket } from "net";

interface ClientMessage {
  userId: string;
  publico: PublicoKey;
  pergunta: string;
}

export class ChatController {
  wss: WebSocketServer;

  constructor(server: any) {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on("connection", (ws: WebSocket) => {
      let currentHistoricId: string | null = null;
      console.log("Cliente conectado via WebSocket!");

      ws.on("message", async (data: Data) => {
        try {
          const rawMsg: ClientMessage = JSON.parse(data.toString());
          const { resposta, historicId } = await handleChatMessage(rawMsg);
          currentHistoricId = historicId;
          ws.send(JSON.stringify({ role: "assistant", content: resposta }));
        } catch (error: any) {
          console.error("Erro no WS chat:", error);
          ws.send(JSON.stringify({ error: error.message || "Erro no processamento da mensagem" }));
        }
      });

      ws.on("close", async () => {
        if (currentHistoricId) {
          console.log(`WebSocket encerrado. Atualizando histórico ${currentHistoricId} como terminado.`);
          await prisma.historic.update({
            where: { historicId: currentHistoricId },
            data: { terminated: true, endedAt: new Date() },
          });
        }
      });
    });

    interface UpgradeRequest extends IncomingMessage {
      url: string;
      headers: IncomingMessage['headers'] & { host?: string };
    }

    server.on('upgrade', (request: UpgradeRequest, socket: Socket, head: Buffer) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token: string | null = url.searchParams.get('token');

      if (!token) {
        socket.destroy();
        return;
      }

      try {
        const secret: string = process.env.JWT_SECRET!;
        jwt.verify(token, secret);

        this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          this.wss.emit('connection', ws, request);
        });
      } catch {
        socket.destroy();
      }
    });
  }
}
