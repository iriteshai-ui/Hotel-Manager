import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { initDb } from './db.js';
import { stompBroker } from './stomp.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import initialDataRoutes from './routes/initialData.js';
import tableRoutes from './routes/tables.js';
import orderRoutes from './routes/orders.js';
import insightsRoutes from './routes/insights.js';
import menuRoutes from './routes/menu.js';
import hotelsRoutes from './routes/hotels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth filter
app.use(authMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', initialDataRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/hotels', hotelsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', database: 'supabase-postgresql', timestamp: new Date().toISOString() });
});

// Setup STOMP WebSocket/SockJS broker
stompBroker.setup(server);

// Static client file serving for production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const clientPublicPath = path.resolve(__dirname, '../../client/public');

if (fs.existsSync(clientPublicPath)) {
  app.use(express.static(clientPublicPath));
}

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for HTML5 routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = parseInt(process.env.PORT, 10) || 8081;

async function startServer() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await initDb();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`=========================================`);
      console.log(`  AURA Dining Backend (Node.js/Express)  `);
      console.log(`  Database: Supabase PostgreSQL (Connected)`);
      console.log(`  Running on: http://localhost:${PORT}   `);
      console.log(`  WebSocket / STOMP: /ws                 `);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('Failed to initialize database and start server:', err);
    process.exit(1);
  }
}

startServer();
