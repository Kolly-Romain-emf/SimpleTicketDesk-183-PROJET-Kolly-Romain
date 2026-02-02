import { Ticket } from '../models/ticketModel.js';
import { AuditLog } from '../models/auditLogModel.js';
import { logger } from '../config/logger.js';

// GET /api/tickets/public
export const listPublic = async (_req, res, next) => {
  try {
    const tickets = await Ticket.getPublicTickets();
    return res.json({ tickets });
  } catch (err) {
    return next(err);
  }
};

// GET /api/tickets/mine
export const listMine = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const tickets = await Ticket.getTicketsByUser(userId);
    return res.json({ tickets });
  } catch (err) {
    return next(err);
  }
};

// GET /api/tickets (auth)
export const listAll = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;
    if (sessionUser.role === 'ADMIN') {
      const tickets = await Ticket.getAllTickets();
      return res.json({ tickets });
    }
    // Par defaut, on retourne les tickets de l'utilisateur connecte
    const tickets = await Ticket.getTicketsByUser(sessionUser.id);
    return res.json({ tickets });
  } catch (err) {
    return next(err);
  }
};

// GET /api/tickets/:id
export const getById = async (req, res, next) => {
  try {
    const ticket = await Ticket.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Autoriser si public, owner ou admin
    const sessionUser = req.session.user;
    const isOwner = sessionUser && sessionUser.id === ticket.fk_user;
    const isAdmin = sessionUser && sessionUser.role === 'ADMIN';
    if (!ticket.is_public && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json({ ticket });
  } catch (err) {
    return next(err);
  }
};

// POST /api/tickets
export const createTicket = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { title, description, fk_status, is_public } = req.body || {};
    if (!title || !description || !fk_status) {
      return res.status(400).json({ error: 'title, description, fk_status are required' });
    }

    const result = await Ticket.createNew({
      title,
      description,
      fk_status,
      is_public: is_public ? 1 : 0,
      fk_user: userId,
    });

    const created = await Ticket.getTicketById(result.insertId);
    await AuditLog.create({
      userId,
      action: `TICKET_CREATE pk_ticket=${created.pk_ticket}`,
    });
    logger.info(`Ticket created pk_ticket=${created.pk_ticket} by user=${userId}`);
    return res.status(201).json({ ticket: created });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/tickets/:id
export const updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const sessionUser = req.session.user;
    const isOwner = sessionUser && sessionUser.id === ticket.fk_user;
    const isAdmin = sessionUser && sessionUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, description, fk_status, is_public } = req.body || {};
    if (!title || !description || !fk_status) {
      return res.status(400).json({ error: 'title, description, fk_status are required' });
    }

    await Ticket.updateTicket(req.params.id, {
      title,
      description,
      fk_status,
      is_public: is_public ? 1 : 0,
    });

    const updated = await Ticket.getTicketById(req.params.id);
    await AuditLog.create({
      userId: sessionUser.id,
      action: `TICKET_UPDATE pk_ticket=${updated.pk_ticket}`,
    });
    logger.info(`Ticket updated pk_ticket=${updated.pk_ticket} by user=${sessionUser.id}`);
    return res.json({ ticket: updated });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/tickets/:id
export const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const sessionUser = req.session.user;
    const isOwner = sessionUser && sessionUser.id === ticket.fk_user;
    const isAdmin = sessionUser && sessionUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Ticket.deleteTicket(req.params.id);
    await AuditLog.create({
      userId: sessionUser.id,
      action: `TICKET_DELETE pk_ticket=${ticket.pk_ticket}`,
    });
    logger.info(`Ticket deleted pk_ticket=${ticket.pk_ticket} by user=${sessionUser.id}`);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
