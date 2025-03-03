import { Express } from "express";
import { Chat } from "../models/Chat";

export function setupChatRoutes(app: Express) {
  // Save chat message
  app.post("/api/chat/send", async (req, res) => {
    try {
      const { senderId, receiverId, message } = req.body;
      const chat = new Chat({ senderId, receiverId, message });
      await chat.save();
      res.status(201).json({ success: true, chat });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get chat history for a user
  app.get("/api/chat/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const chats = await Chat.find({ $or: [{ senderId: userId }, { receiverId: userId }] });
      res.status(200).json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
}
