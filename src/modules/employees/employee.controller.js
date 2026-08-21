const asyncHandler = require("express-async-handler");
const { getPrisma } = require("../../config/prisma");

const employeeService = require("./employee.service");
const factory = require("../../controllers/handleFactory");

const prisma = getPrisma();

//@desc Create a new employee
//@route POST /api/v1/employees
//@access Private (gallery_owner)
const createEmployee = asyncHandler(async (req, res) => {
  if (req.params.galleryId) {
    req.body.galleryId = req.params.galleryId;
  }

  const employee = await employeeService.createEmployee(req.body);

  res.status(201).json({
    data: employee,
  });
});

//@desc Get all employees
//@route GET /api/v1/employees
//@access Private (gallery_owner)
const getAllEmployees = factory.getAll(prisma.employee, "employee");

//@desc Get an employee by id
//@route GET /api/v1/employees/:id
//@access Private (gallery_owner)
const getEmployee = factory.getOne(prisma.employee, { user: true });

//@desc Update an employee by id
//@route PUT /api/v1/employees/:id
//@access Private (gallery_owner / employee)
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(
    req.employee,
    req.body,
    req.user,
  );

  res.status(200).json({
    data: employee,
  });
});

//@desc Delete an employee by id
//@route DELETE /api/v1/employees/:id
//@access Private (gallery_owner / employee)
const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.deleteEmployee(req.employee);

  res.status(204).send();
});

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
};
