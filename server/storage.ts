import { User, Message, InsertUser, InsertMessage, UpdateUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser & { userId: string }): Promise<User>;
  updateUser(id: number, update: UpdateUser): Promise<User>;
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage & { userId: number }): Promise<Message>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  sessionStore: session.Store;
  private currentUserId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser & { userId: string }): Promise<User> {
    const id = this.currentUserId++;
    const user = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      avatar: null,
      status: "online",
      lastSeen: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, update: UpdateUser): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    // Check if username is taken
    if (update.username) {
      const existing = await this.getUserByUsername(update.username);
      if (existing && existing.id !== id) {
        throw new Error("Username already taken");
      }
    }

    const updatedUser = {
      ...user,
      ...update,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async createMessage(message: InsertMessage & { userId: number }): Promise<Message> {
    const id = this.currentMessageId++;
    const newMessage = {
      ...message,
      id,
      createdAt: new Date(),
      reactions: [],
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
}

export const storage = new MemStorage();