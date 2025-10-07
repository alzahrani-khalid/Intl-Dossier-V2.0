import { Router } from 'express';
import { z } from 'zod';
import { CommitmentService } from '../services/CommitmentService';
import { validate, paginationSchema, idParamSchema } from '../utils/validation';

const router = Router();
const commitmentService = new CommitmentService();

const createCommitmentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  due_date: z.string().datetime(),
  mou_id: z.string().uuid().optional(),
  responsible_party: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'fulfilled', 'overdue', 'cancelled']).default('pending')
});

// Commitment tracking endpoints
router.get('/', validate({ query: paginationSchema }), async (req, res, next) => {
  try {
    const commitments = await commitmentService.findAll(req.query);
    res.json(commitments);
  } catch (error) {
    next(error);
  }
});

router.get('/overdue', async (req, res, next) => {
  try {
    const overdue = await commitmentService.getOverdueCommitments();
    res.json({ data: overdue });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate({ body: createCommitmentSchema }), async (req, res, next) => {
  try {
    const commitment = await commitmentService.create({
      ...req.body,
      created_by: req.user?.id
    });
    res.status(201).json(commitment);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { status } = req.body;
    const commitment = await commitmentService.updateStatus(req.params.id!, status);
    res.json(commitment);
  } catch (error) {
    next(error);
  }
});

export default router;
