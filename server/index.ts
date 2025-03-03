import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import "dotenv/config";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import passport from "passport";
import connectDB from "./db";
import session from "express-session";
import { Chat } from "./models/Chat";
import { setupChatRoutes } from "./routes/chatRoutes";

declare module "express" {
  interface Request {
    user?: {
      id: number;
      username: string;
    };
  }
}

// Connect to MongoDB
connectDB();

declare module "express-session" {
  interface SessionData {
    passport: {
      user: number;
    };
  }
}

// Declare global WebSocket server
declare global {
  var wss: WebSocketServer;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(
  session({
    secret: "your-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  })
);

// Initialize passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Setup authentication first
setupAuth(app);

// Logging middleware
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

  // Setup WebSocket server globally
  global.wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  // Track clients
  const clients = new Map<any, number>();

  global.wss.on("connection", async (ws, req) => {
    log("WebSocket client connected");

    try {
      const cookieString = req.headers.cookie;
      const sessionId = cookieString
        ?.split(";")
        .find((c) => c.trim().startsWith("connect.sid="))
        ?.split("=")[1];

      if (!sessionId) {
        log("WebSocket connection rejected: No session ID found");
        ws.close(4001, "Unauthorized");
        return;
      }

      // Get user from session
      const sessionData = await new Promise<{ passport?: { user: number } } | null>((resolve) => {
        storage.sessionStore.get(sessionId, (err, session) => {
          if (err) {
            log(`Session fetch error: ${err.message}`);
            resolve(null);
          } else {
            resolve(session as { passport?: { user: number } } | null);
          }
        });
      });

      if (!sessionData || !sessionData.passport?.user) {
        log("WebSocket connection rejected: User not found in session");
        ws.close(4001, "Unauthorized");
        return;
      }

      const userId = sessionData.passport.user;
      clients.set(ws, userId);

      // Update user status
      await storage.updateUser(userId, { status: "online" });

      // Broadcast updated user list
      const users = await storage.getUsers();
      global.wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify({ type: "users", data: users }));
        }
      });

      ws.on("message", async (data) => {
        try {
          const { senderId, receiverId, message } = JSON.parse(data.toString());

          // Save message to MongoDB
          const chat = new Chat({ senderId, receiverId, message });
          await chat.save();

          // Broadcast message to the receiver
          global.wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify({ type: "chat", data: chat }));
            }
          });
        } catch (error) {
          log(`WebSocket Message Error: ${error}`);
        }
      });

      ws.on("error", (error) => {
        log(`WebSocket error: ${error.message}`);
      });

      ws.on("close", async () => {
        log("WebSocket client disconnected");
        const userId = clients.get(ws);
        if (userId) {
          await storage.updateUser(userId, {
            status: "offline",
            lastSeen: new Date(),
          });
          clients.delete(ws);

          const users = await storage.getUsers();
          global.wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify({ type: "users", data: users }));
            }
          });
        }
      });
    } catch (error) {
      log(`WebSocket authentication error: ${error}`);
      ws.close(4001, "Unauthorized");
    }
  });

  // Setup API routes
  setupChatRoutes(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 8080;
  server.listen(
    {
      port,
      host: "127.0.0.1",
      reusePort: true,
    },
    () => {
      log(`Server running on port ${port}`);
      log(`WebSocket server running on ws://127.0.0.1:${port}/ws`);
    }
  );
})();
