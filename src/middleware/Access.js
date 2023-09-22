import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../helpers/jwtConfig.js";

const prisma = new PrismaClient();

export const authentication = async (req, res, next) => {
  const accessTokenBearer = req.header("Authorization");
  const accessToken = accessTokenBearer.replace(/^Bearer /, "");
  if (!accessToken) {
    return res.status(401).json({ msg: "Please Login First!!" });
  }
  try {
    const payload = verifyAccessToken(accessToken);
    if (payload.msg) {
      return res.status(400).json({ msg: payload.msg });
    }
    const user = await prisma.users.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true },
    });
    if (!user) {
      return res.status(404).json({ msg: "User Not Found" });
    }
    req.userId = user.id;
    req.email = user.email;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const authorization = async (req, res, next) => {
  const { accessToken } = req.headers;
  if (!accessToken) {
    return res.status(401).json({ msg: "Please Login First!!" });
  }
  const payload = verifyAccessToken(accessToken);
  const outlaySelected = req.params.id
  const outlay = await prisma.outlays.findUnique({ where: { id: outlaySelected } });
  if (!outlay) {
    return res.status(404).json({ msg: "Not Found" });
  }
  if (outlay.user_id === payload.id) {
    next();
  } else {
    return res.status(401).json({ msg: "Unauthorized" });
  }
};
