import session from "express-session";
import { User, Message } from "./db/models";
import type { IUser, IMessage } from "./db/models";
import { InsertUser, InsertMessage, UpdateUser } from "@shared/schema";
import MongoStore from "connect-mongo";

export interface IStorage {
  getUser(id: string): Promise<IUser | null>;
  getUserByUsername(username: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  getUsers(): Promise<IUser[]>;
  createUser(user: InsertUser & { userId: string }): Promise<IUser>;
  updateUser(id: string, update: UpdateUser): Promise<IUser>;
  getMessages(): Promise<IMessage[]>;
  createMessage(message: InsertMessage & { userId: string }): Promise<IMessage>;
  sessionStore: session.Store;
}

export class MongoStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatroom',
      collectionName: 'sessions',
      ttl: 24 * 60 * 60 // 1 day
    });
  }

  async getUser(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username });
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async getUsers(): Promise<IUser[]> {
    return await User.find();
  }

  async createUser(insertUser: InsertUser & { userId: string }): Promise<IUser> {
    const user = new User({
      ...insertUser,
      status: 'online',
      lastSeen: new Date()
    });
    return await user.save();
  }

  async updateUser(id: string, update: UpdateUser): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) throw new Error("User not found");

    if (update.username) {
      const existing = await this.getUserByUsername(update.username);
      if (existing && existing.id !== id) {
        throw new Error("Username already taken");
      }
    }

    Object.assign(user, update);
    return await user.save();
  }

  async getMessages(): Promise<IMessage[]> {
    return await Message.find().sort({ createdAt: 1 }).populate('userId');
  }

  async createMessage(message: InsertMessage & { userId: string }): Promise<IMessage> {
    const newMessage = new Message({
      content: message.content,
      userId: message.userId,
      reactions: []
    });
    return await newMessage.save();
  }
}

export const storage = new MongoStorage();