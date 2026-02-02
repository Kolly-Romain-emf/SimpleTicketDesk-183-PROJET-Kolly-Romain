import { Router } from 'express';
import {
  listPublic,
  listMine,
  listAll,
  getById,
  createTicket,
  updateTicket,
  deleteTicket,
} from '../controllers/ticketController.js';
import { ensureAuthenticated } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validationMiddleware.js';

const router = Router();

const idParamSchema = {
  id: { type: 'number', required: true },
};

const ticketSchema = {
  title: { type: 'string', required: true, minLength: 1, maxLength: 255, trim: true },
  description: { type: 'string', required: true, minLength: 1, maxLength: 2000, trim: true },
  fk_status: { type: 'number', required: true },
  is_public: { type: 'boolean', required: false },
};

// Tickets publics accessibles sans auth
router.get('/public', listPublic);

// Tickets de l'utilisateur connecte
router.get('/mine', ensureAuthenticated, listMine);

// Tickets (auth) : admin -> tous, sinon mes tickets
router.get('/', ensureAuthenticated, listAll);

// Detail (autorisation dans le controleur)
router.get('/:id', validateParams(idParamSchema), getById);

// Creation / modification / suppression protegees
router.post('/', ensureAuthenticated, validateBody(ticketSchema), createTicket);
router.put('/:id', ensureAuthenticated, validateParams(idParamSchema), validateBody(ticketSchema), updateTicket);
router.delete('/:id', ensureAuthenticated, validateParams(idParamSchema), deleteTicket);

export default router;
