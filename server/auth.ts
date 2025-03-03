import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { nanoid } from "nanoid";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`🔹 Attempting login for: ${username}`);

      let user = await storage.getUserByUsername(username);
      if (!user) user = await storage.getUserByEmail(username);

      if (!user) {
        console.log("❌ User not found");
        return done(null, false, { message: "User not found" });
      }

      const passwordMatch = await comparePasswords(password, user.password);
      if (!passwordMatch) {
        console.log("❌ Incorrect password");
        return done(null, false, { message: "Incorrect password" });
      }

      console.log("✅ Login successful!");
      return done(null, user);
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) return res.status(400).send("Email already exists");

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) return res.status(400).send("Username already exists");

      const user = await storage.createUser({
        ...req.body,
        userId: nanoid(10),
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message?: string } | undefined) => {
      if (err) {
        console.error("❌ Authentication Error:", err);
        return next(err);
      }
      if (!user) {
        console.warn("⚠️ Login Failed:", info?.message);
        return res.status(401).json({ error: info?.message || "Login failed" });
      }
  
      req.login(user, (err: Error | null) => {
        if (err) {
          console.error("❌ Login Error:", err);
          return next(err);
        }
        console.log("✅ User logged in:", user.username);
        res.status(200).json(user);
      });
    })(req, res, next);
  }); // Ensure this closing } is present
  
}
