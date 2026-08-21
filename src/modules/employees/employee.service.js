const bcrypt = require("bcryptjs");

const { getPrisma } = require("../../config/prisma");
const { ROLES } = require("../../shared/constants/roles");

const prisma = getPrisma();

const createEmployee = async (employeeData) => {
  const hashedPassword = await bcrypt.hash(employeeData.password, 12);

  return prisma.$transaction(async (tx) => {
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
};

const updateEmployee = async (employee, updateData, actor) => {
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
        id: employee.id,
      },
      data: {
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.isActive !== undefined &&
          actor.role !== ROLES.EMPLOYEE && { isActive: updateData.isActive }),
      },
      include: {
        user: true,
        gallery: true,
      },
    });
  });

  return updated;
};

const deleteEmployee = async (employee) => {
  await prisma.user.delete({
    where: {
      id: employee.userId,
    },
  });
};

module.exports = {
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
