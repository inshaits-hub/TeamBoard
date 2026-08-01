import { Router } from 'express';
import {
  register,
  login,
  getMe,
  createMember,
  listMembers,
  deleteMember,
  getOrgInfo,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/org-info', protect, getOrgInfo);
router.post('/members', protect, createMember);
router.get('/members', protect, listMembers);
router.delete('/members/:id', protect, deleteMember);

export default router;
