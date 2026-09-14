const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  PAID: "paid",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

// Define valid status transitions
const ORDER_TRANSITIONS = Object.freeze({
  pending: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELLED],
  accepted: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  paid: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  delivered: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
});

module.exports = { ORDER_STATUS, ORDER_TRANSITIONS };
