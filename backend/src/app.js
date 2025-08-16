// src/app.js

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authMiddleware from './middleware/auth.js';

// Initialize Express app and Prisma Client
const app = express();
const prisma = new PrismaClient();
const port = 5000;

// --- Middleware ---
// Enable CORS for all routes, allowing your frontend to connect
app.use(cors());
// Enable Express to parse JSON in request bodies
app.use(express.json());

// --- Public Routes (No Auth Needed) ---

app.get('/', (req, res) => {
  res.send('TaskFlow API is running!');
});

/**
 * @route POST /api/register
 * @desc Register a new user
 * @access Public
 */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      createdAt: newUser.createdAt,
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route POST /api/login
 * @desc Authenticate a user and return a JWT
 * @access Public
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// --- Protected Routes (Auth Required) ---

/**
 * @route   POST /api/tasks
 * @desc    Create a new task for the logged-in user
 * @access  Private
 */
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: userId,
        assignedToId: userId,
      },
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the logged-in user
 * @access  Private
 */
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { createdById: userId },
          { assignedToId: userId }
        ]
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- NEW CODE STARTS HERE ---

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task's title, description, or status
 * @access  Private
 */
app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    // Now we can accept title, description, and status from the request body
    const { title, description, status } = req.body;
    const taskId = req.params.id;
    const userId = req.user.id;

    // --- Authorization check remains the same ---
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (task.createdById !== userId && task.assignedToId !== userId) {
      return res.status(403).json({ message: 'User not authorized to update this task' });
    }

    // --- Build the data object for the update ---
    // This dynamically includes only the fields that were provided in the request
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;

    // --- Update the task with the new data ---
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (task.createdById !== userId && task.assignedToId !== userId) {
      return res.status(403).json({ message: 'User not authorized to delete this task' });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ message: 'Task removed successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- NEW CODE ENDS HERE ---


// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});