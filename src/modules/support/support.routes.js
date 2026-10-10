const express = require("express");

const router = express.Router();
const {
  createTicket,
  getAllTickets,
  getTicket,
  updateTicket,
  deleteTicket,
} = require("./support.controller");

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../shared/constants/roles");

const {
  createTicketValidator,
  updateTicketValidator,
  ticketIdValidator,
} = require("./support.validation");

router.route("/").post(createTicketValidator, createTicket).get(
  protect,
  allowTo([ROLES.ADMIN]),
  // reuse the generic factory listing (pagination/filter/sort via query)
  getAllTickets,
);

router
  .route("/:id")
  .get(protect, allowTo([ROLES.ADMIN]), ticketIdValidator, getTicket)
  .put(protect, allowTo([ROLES.ADMIN]), updateTicketValidator, updateTicket)
  .delete(protect, allowTo([ROLES.ADMIN]), ticketIdValidator, deleteTicket);

module.exports = router;
