import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';

const router = Router();
const statuses = ['todo', 'in-progress', 'done'];
const priorities = ['low', 'medium', 'high'];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid request', errors: errors.array() });
  }
  return next();
};

const taskFields = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().trim().isLength({ max: 5000 }),
  body('status').optional().isIn(statuses),
  body('priority').optional().isIn(priorities)
];

const taskId = [
  param('id').custom((value) => mongoose.isValidObjectId(value))
];

router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

router.post('/', taskFields, validate, async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, owner: req.user.id });
    return res.status(201).json({ task });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', taskId, validate, async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.json({ task });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', [...taskId, ...taskFields], validate, async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.json({ task });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', taskId, validate, async (req, res, next) => {
  try {
    const result = await Task.deleteOne({ _id: req.params.id, owner: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
