import mongoose, { Document } from "mongoose";

export interface IChat extends Document {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
}

const ChatSchema = new mongoose.Schema<IChat>({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);
