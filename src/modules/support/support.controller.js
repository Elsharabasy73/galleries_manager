const asyncHandler = require("express-async-handler");
const factory = require("../../controllers/handleFactory");
const { getPrisma } = require("../../config/prisma");

const prisma = getPrisma();

// @desc Create a support ticket (only user-supplied fields are accepted;
//        status always starts as `new`)
// @route POST /api/v1/support
// @access Public
const createTicket = asyncHandler(async (req, res) => {
  const { name, email, type, subject, description, userId, pageUrl, userAgent } =
    req.body || {};

  const document = await prisma.supportTicket.create({
    data: {
      name,
      email,
      type: type || undefined,
      subject,
      description,
      userId: userId || undefined,
      pageUrl: pageUrl || undefined,
      userAgent: userAgent || undefined,
    },
  });

  res.status(201).json({
    data: document,
  });
});

// @desc Get all support tickets
// @route GET /api/v1/support
// @access Private (admin)
const getAllTickets = factory.getAll(prisma.supportTicket);

// @desc Get one support ticket
// @route GET /api/v1/support/:id
// @access Private (admin)
const getTicket = factory.getOne(prisma.supportTicket);

// @desc Update a support ticket status (status-only; body is pre-validated)
// @route PUT /api/v1/support/:id
// @access Private (admin)
const updateTicket = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const document = await prisma.supportTicket.update({
      where: { id },
      data: { status: req.body.status },
    });
    res.status(200).json({ data: document });
  } catch (error) {
    if (error.code === "P2025") {
      const ApiError = require("../../shared/utils/ApiError");
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    next(error);
  }
});

// @desc Delete a support ticket
// @route DELETE /api/v1/support/:id
// @access Private (admin)
const deleteTicket = factory.deleteOne(prisma.supportTicket);

module.exports = {
  createTicket,
  getAllTickets,
  getTicket,
  updateTicket,
  deleteTicket,
};
