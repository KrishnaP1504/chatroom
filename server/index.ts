import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { setupAuth } from "./auth";
import { storage } from "./storage";

// Declare global WebSocket server
declare global {
  var wss: WebSocketServer;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup auth first before routes
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create HTTP server first
  const server = await registerRoutes(app);

  // Create WebSocket server and make it globally available
  global.wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  // Track clients and their associated user IDs
  const clients = new Map<any, number>();

  global.wss.on('connection', async (ws, req) => {
    log('WebSocket client connected');

    // Extract user ID from session cookie
    const cookieString = req.headers.cookie;
    const sessionId = cookieString?.split(';')
      .find(c => c.trim().startsWith('connect.sid='))
      ?.split('=')[1];

    if (!sessionId) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    // Get user from session
    try {
      // Find user ID from session
      const sessionData = await new Promise((resolve) => {
        storage.sessionStore.get(sessionId, (err, session) => {
          resolve(session);
        });
      });

      if (!sessionData || !sessionData.passport?.user) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      const userId = sessionData.passport.user;
      clients.set(ws, userId);

      // Update user status to online
      await storage.updateUser(userId, { status: 'online' });

      // Broadcast updated user list to all clients
      const users = await storage.getUsers();
      global.wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify({ type: 'users', data: users }));
        }
      });

      ws.on('error', (error) => {
        log(`WebSocket error: ${error.message}`);
      });

      ws.on('close', async () => {
        log('WebSocket client disconnected');
        const userId = clients.get(ws);
        if (userId) {
          // Update user status to offline and last seen
          await storage.updateUser(userId, { 
            status: 'offline',
            lastSeen: new Date()
          });
          clients.delete(ws);

          // Broadcast updated user list
          const users = await storage.getUsers();
          global.wss.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify({ type: 'users', data: users }));
            }
          });
        }
      });
    } catch (error) {
      log(`WebSocket authentication error: ${error}`);
      ws.close(4001, 'Unauthorized');
    }
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running on port ${port}`);
    log(`WebSocket server running on ws://0.0.0.0:${port}/ws`);
  });
})();