import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Voting System API is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/elections', async (_req, res) => {
  try {
    const elections = await prisma.election.findMany({
      include: {
        positions: {
          include: {
            candidates: true,
          },
        },
      },
    });

    res.json({ success: true, data: elections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch elections' });
  }
});

app.get('/api/v1/counties', async (_req, res) => {
  try {
    const counties = await prisma.county.findMany({
      include: {
        constituencies: {
          include: {
            wards: true,
          },
        },
      },
    });

    res.json({ success: true, data: counties });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch counties' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
