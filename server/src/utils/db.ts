import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from './logger';

export let isConnectedToMongo = false;

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnectedToMongo = true;
    logger.info(`MongoDB connected successfully to ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`Could not connect to MongoDB at ${config.mongodb.uri}. Switching to In-Memory Resilient ATS Store for local development.`);
    isConnectedToMongo = false;
  }
}
