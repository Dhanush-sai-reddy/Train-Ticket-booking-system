import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { kafkaService } from '../services/kafka.service';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

class AuthController {
  // Register a new user
  public register = async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          profile: {
            create: {
              // Default profile
            }
          }
        },
        include: { profile: true }
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      // Publish Event to Kafka
      try {
        await kafkaService.publish('booking-events', { // Reusing topic for simplicity, or create 'auth-events'
          event: 'USER_REGISTERED',
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error("Kafka publish error:", err);
      }

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  };

  // Login user
  public login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  };
}

export const authController = new AuthController();
