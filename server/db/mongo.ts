import mongoose from 'mongoose';
import { log } from '../vite';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatroom';

export async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB', 'mongodb');
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    process.exit(1);
  }
}

// Monitor connection events
mongoose.connection.on('error', err => {
  log(`MongoDB connection error: ${err}`, 'mongodb');
});

mongoose.connection.on('disconnected', () => {
  log('MongoDB disconnected', 'mongodb');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
