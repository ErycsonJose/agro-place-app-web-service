import express from 'express';
import authRoutes from './auth.js';
import syncRoutes from './sync.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/sync', authMiddleware, syncRoutes);

export default router;