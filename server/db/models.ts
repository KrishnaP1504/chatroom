import mongoose, { Schema, Document } from 'mongoose';

// User Interface
export interface IUser extends Document {
  userId: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

// Message Interface
export interface IMessage extends Document {
  content: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  reactions: string[];
}

// User Schema
const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  avatar: { type: String },
  status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
  lastSeen: { type: Date }
});

// Message Schema
const MessageSchema = new Schema<IMessage>({
  content: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  reactions: [{ type: String }]
});

// Create indexes without duplicates
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
MessageSchema.index({ createdAt: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
export const Message = mongoose.model<IMessage>('Message', MessageSchema);