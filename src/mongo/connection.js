import mongoose from 'mongoose';
import { env } from '../config/env.js';

let conectado = false;

export function isMongoHabilitado() {
  return env.FEATURE_ASISTENTE === true;
}

export async function connectMongo() {
  if (!isMongoHabilitado()) {
    return null;
  }

  if (conectado && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  conectado = true;
  return mongoose.connection;
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  conectado = false;
}

export function getEstadoMongo() {
  if (!isMongoHabilitado()) {
    return 'disabled';
  }
  const estados = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return estados[mongoose.connection.readyState] ?? 'unknown';
}
