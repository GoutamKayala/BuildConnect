import express from 'express';
import {
  getConversations,
  findOrCreateConversation,
  getMessagesByConversation,
  sendMessage,
  handleMessageAction,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/find-or-create', findOrCreateConversation);
router.get('/:conversationId/messages', getMessagesByConversation);
router.post('/messages', sendMessage);
router.post('/messages/action', handleMessageAction);

export default router;
