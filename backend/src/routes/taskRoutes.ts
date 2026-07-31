import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  bulkTasks,
  saveOrder,
  replaceAll,
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', listTasks);
router.post('/', createTask);
router.post('/bulk', bulkTasks);
router.put('/order', saveOrder);
router.put('/replace', replaceAll);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
