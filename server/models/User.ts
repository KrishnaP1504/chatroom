import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  userId: string;
  username: string;
  email: string;
  password: string;
  status: "online" | "offline";
  lastSeen?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  lastSeen: { type: Date, default: null },
});

export const User = mongoose.model<IUser>("User", UserSchema);
