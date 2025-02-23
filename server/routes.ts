import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws"
  });

  wss.on('connection', (ws) => {
    ws.on('error', console.error);
  });

  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = insertMessageSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const message = await storage.createMessage({
      ...result.data,
      userId: req.user.id,
    });

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });

    res.status(201).json(message);
  });

  return httpServer;
}