import { Response } from 'express';
import Task from '../models/taskModel';
import User from '../models/userModel';
import { AuthRequest } from '../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../middleware/errorMiddleware';
import {
  bulkSchema,
  orderSchema,
  replaceAllSchema,
  taskSchema,
  taskUpdateSchema,
} from '../validation/schemas';

/** Shape returned to the client — mirrors the frontend `Task` type. */
const toClient = (doc: any) => ({
  id: doc.clientId,
  title: doc.title,
  description: doc.description ?? '',
  column: doc.column,
  priority: doc.priority,
  label: doc.label,
  severity: doc.severity ?? 'minor',
  reviewer: doc.reviewer ?? '',
  storyPoints: doc.storyPoints ?? 0,
  estimatedEffort: doc.estimatedEffort ?? 0,
  dependencies: doc.dependencies ?? [],
  subtasks: doc.subtasks ?? [],
  checklist: doc.checklist ?? [],
  recurrence: doc.recurrence ?? { frequency: 'none', interval: 1, endsOn: '' },
  createdBy: doc.createdBy ?? '',
  dueDate: doc.dueDate ?? '',
  assignee: doc.assignee ?? 'Me',
  comments: doc.comments ?? 0,
  attachments: doc.attachments ?? 0,
  createdAt: doc.createdAtISO ?? new Date().toISOString(),
});

const badRequest = (error: any) =>
  new HttpError(400, 'Invalid request', error.flatten().fieldErrors);

/** Ordering is stored on the user document so it survives task edits. */
async function readOrder(userId: string) {
  const user = await User.findById(userId).select('boardOrder listOrder');
  return {
    boardOrder: user?.boardOrder ?? [],
    listOrder: user?.listOrder ?? [],
  };
}

export const listTasks = asyncHandler<AuthRequest>(async (req, res) => {
  const owner = req.userId;
  const [docs, order] = await Promise.all([
    Task.find({ owner }).sort({ boardIndex: 1, createdAt: -1 }),
    readOrder(owner!),
  ]);
  res.json({ tasks: docs.map(toClient), ...order });
});

export const createTask = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest(parsed.error);

  const doc = await Task.findOneAndUpdate(
    { owner: req.userId, clientId: parsed.data.clientId },
    { ...parsed.data, owner: req.userId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(toClient(doc));
});

export const updateTask = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest(parsed.error);

  const doc = await Task.findOneAndUpdate(
    { owner: req.userId, clientId: req.params.id },
    parsed.data,
    { new: true }
  );
  if (!doc) throw new HttpError(404, 'Task not found');
  res.json(toClient(doc));
});

export const deleteTask = asyncHandler<AuthRequest>(async (req, res) => {
  const result = await Task.deleteOne({
    owner: req.userId,
    clientId: req.params.id,
  });
  if (result.deletedCount === 0) throw new HttpError(404, 'Task not found');
  res.json({ ok: true });
});

export const bulkTasks = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest(parsed.error);

  const { ids, action, column, priority } = parsed.data;
  const filter = { owner: req.userId, clientId: { $in: ids } };

  if (action === 'delete') {
    const result = await Task.deleteMany(filter);
    return res.json({ ok: true, affected: result.deletedCount });
  }
  if (action === 'column') {
    if (!column) throw new HttpError(400, 'column is required');
    const result = await Task.updateMany(filter, { column });
    return res.json({ ok: true, affected: result.modifiedCount });
  }
  if (!priority) throw new HttpError(400, 'priority is required');
  const result = await Task.updateMany(filter, { priority });
  res.json({ ok: true, affected: result.modifiedCount });
});

export const saveOrder = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest(parsed.error);

  const update: Record<string, string[]> = {};
  if (parsed.data.boardOrder) update.boardOrder = parsed.data.boardOrder;
  if (parsed.data.listOrder) update.listOrder = parsed.data.listOrder;

  await User.updateOne({ _id: req.userId }, update);

  if (parsed.data.boardOrder) {
    await Promise.all(
      parsed.data.boardOrder.map((clientId, boardIndex) =>
        Task.updateOne({ owner: req.userId, clientId }, { boardIndex })
      )
    );
  }
  if (parsed.data.listOrder) {
    await Promise.all(
      parsed.data.listOrder.map((clientId, listIndex) =>
        Task.updateOne({ owner: req.userId, clientId }, { listIndex })
      )
    );
  }

  res.json({ ok: true });
});

/** Full replace — used by the client's first sync and by JSON import. */
export const replaceAll = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = replaceAllSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest(parsed.error);

  const owner = req.userId;
  const { tasks, boardOrder, listOrder } = parsed.data;
  const keep = tasks.map((t) => t.clientId);

  await Task.deleteMany({ owner, clientId: { $nin: keep } });
  await Promise.all(
    tasks.map((task) =>
      Task.findOneAndUpdate(
        { owner, clientId: task.clientId },
        { ...task, owner },
        { upsert: true, setDefaultsOnInsert: true }
      )
    )
  );
  await User.updateOne(
    { _id: owner },
    { boardOrder: boardOrder ?? keep, listOrder: listOrder ?? keep }
  );

  const docs = await Task.find({ owner });
  res.json({
    tasks: docs.map(toClient),
    boardOrder: boardOrder ?? keep,
    listOrder: listOrder ?? keep,
  });
});
