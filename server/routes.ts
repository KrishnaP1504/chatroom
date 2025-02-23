import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMessageSchema, updateUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);

  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getUsers();
    res.json(users);
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

    // Emit to WebSocket clients through the global wss instance
    global.wss?.clients?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });

    res.status(201).json(message);
  });

  // Add profile update route
  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = updateUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const updatedUser = await storage.updateUser(req.user.id, result.data);
    res.json(updatedUser);
  });

  return httpServer;
}