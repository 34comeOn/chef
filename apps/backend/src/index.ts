import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import recipeRouter from './routes/recipe';

const app = express();
const PORT = process.env['PORT'] || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      message: error instanceof Error ? error.message : 'Unknown DB error'
    });
  }
});

app.use('/api/recipes', recipeRouter);

app.listen(PORT, () => {
  console.log(`🚀 Chef Backend running on http://localhost:${PORT}`);
});
