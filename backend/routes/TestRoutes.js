import express from 'express';
import {
  getAllTests,
  getTestDetails,
  createTest,
  updateTest,
  deleteTest,
  validateTestStart
} from '../controllers/Test.js';
import { isAuthenticated } from '../middlewares.js';

const router = express.Router();

router.get('/', getAllTests);
router.get('/:id/details', getTestDetails);
router.post('/new', createTest);
router.put('/:id', updateTest);
router.delete('/:id', deleteTest);
router.post('/give', isAuthenticated, validateTestStart);

export default router;
