const bcrypt = require("bcryptjs");

const { getPrisma } = require("../../config/prisma");
const ApiError = require("../../shared/utils/ApiError");
const { ROLES } = require("../../shared/constants/roles");

const prisma = getPrisma();

const findOwnerGallery = async (ownerId) => {
  const gallery = await prisma.gallery.findUnique({
    where: {
      ownerId,
    },
  });

  if (!gallery) {
    throw new ApiError("No gallery found for this owner", 404);
  }

  return gallery;
};

const ensureCanManage = async (employee, actor) => {
  if (actor.role === ROLES.ADMIN) {
    return;
  }

  if (actor.role === ROLES.EMPLOYEE) {
    if (employee.userId !== actor.id) {
      throw new ApiError("You can only manage your own profile", 403);
    }

    return;
  }

  const gallery = await findOwnerGallery(actor.id);

  if (employee.galleryId !== gallery.id) {
    throw new ApiError("Employee does not belong to your gallery", 403);
  }
};

const createEmployee = async (employeeData) => {

  const hashedPassword = await bcrypt.hash(employeeData.password, 12);

  const employee = await prisma.$transaction(async (tx) => {
    console.log(employeeData);
    const user = await tx.user.create({
      data: {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        slug: employeeData.slug,
        email: employeeData.email,
        phone: employeeData.phone,
        password: hashedPassword,
        role: ROLES.EMPLOYEE,
      },
    });

    return tx.employee.create({
      data: {
        userId: user.id,
        galleryId: employeeData.galleryId,
        title: employeeData.title,
      },
      include: {
        user: true,
        gallery: true,
      },
    });
  });

  return employee;
};

const getAllEmployees = async (actor) => {
  const where = {};

  if (actor.role !== ROLES.ADMIN) {
    const gallery = await findOwnerGallery(actor.id);
    where.galleryId = gallery.id;
  }

  const employees = await prisma.employee.findMany({
    where,
    include: {
      user: true,
    },
  });

  return employees;
};

const getEmployee = async (id, actor) => {
  const employee = await prisma.employee.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });

  if (!employee) {
    throw new ApiError("Employee not found", 404);
  }

  await ensureCanManage(employee, actor);

  return employee;
};

const updateEmployee = async (id, updateData, actor) => {
  const employee = await prisma.employee.findUnique({
    where: {
      id,
    },
  });

  if (!employee) {
    throw new ApiError("Employee not found", 404);
  }

  await ensureCanManage(employee, actor);

  const actorIsEmployee = actor.role === ROLES.EMPLOYEE;

  const hashedPassword = updateData.password
    ? await bcrypt.hash(updateData.password, 12)
    : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: employee.userId,
      },
      data: {
        ...(updateData.firstName && { firstName: updateData.firstName }),
        ...(updateData.lastName && { lastName: updateData.lastName }),
        ...(updateData.slug && { slug: updateData.slug }),
        ...(updateData.email && { email: updateData.email }),
        ...(updateData.phone && { phone: updateData.phone }),
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    return tx.employee.update({
      where: {
        id,
      },
      data: {
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.isActive !== undefined &&
          !actorIsEmployee && { isActive: updateData.isActive }),
      },
      include: {
        user: true,
        gallery: true,
      },
    });
  });

  return updated;
};

const deleteEmployee = async (id, actor) => {
  const employee = await prisma.employee.findUnique({
    where: {
      id,
    },
  });

  if (!employee) {
    throw new ApiError("Employee not found", 404);
  }

  await ensureCanManage(employee, actor);

  await prisma.user.delete({
    where: {
      id: employee.userId,
    },
  });
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
};
