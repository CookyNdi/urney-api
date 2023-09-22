import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getOutlaysByUserId = async (req, res, next) => {
  try {
    const id = req.userId;
    const outlays = await prisma.outlays.findMany({
      where: { userId: id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(200).json(outlays);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createOutlays = async (req, res, next) => {
  try {
    const { name, description, price } = req.body;
    const userId = req.userId;
    await prisma.$transaction([
      prisma.outlays.create({
        data: {
          userId,
          name,
          description,
          price,
        },
      }),
      prisma.users.update({
        where: { id: userId },
        data: { income: { decrement: price } },
      }),
    ]);
    res.status(200).json({ msg: "Successfully created" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateOutlays = async (req, res, next) => {
  try {
    const { name, description, price } = req.body;
    const { id } = req.params;
    const userId = req.userId;
    const outlay = await prisma.outlays.findUnique({ where: { id } });
    if (!outlay) {
      return res.status(404).json({ msg: "Not Found" });
    }
    await prisma.outlays.update({ where: { id }, data: { name, description, price } });
    const incomeChange = Math.abs(outlay.price - price);
    if (outlay.price !== price) {
      const incomeOperation = outlay.price > price ? 'increment' : 'decrement';
      await prisma.users.update({ where: { id: userId }, data: { income: { [incomeOperation]: incomeChange } } });
    }
    return res.status(200).json({ msg: "Successfully Updated" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const deleteOutlays = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const outlay = await prisma.outlays.findUnique({ where: { id } });
    if (!outlay) {
      return res.status(404).json({ msg: "Not Found" });
    }
    await prisma.outlays.delete({ where: { id } });
    const incomeChange = Math.abs(outlay.price);
    await prisma.users.update({ where: { id: userId }, data: { income: { decrement: incomeChange } } });
    return res.status(200).json({ msg: "Successfully Deleted" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
}