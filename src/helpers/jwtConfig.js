import jwt from "jsonwebtoken";

export const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SCRET_ACCESS, { expiresIn: "1200s" });
};

export const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SCRET_REFRESH, { expiresIn: "7d" });
};

export const verifyAccessToken = (token) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SCRET_ACCESS);
    return decodedToken;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { msg: "Token has expired" };
    } else {
      return { msg: "Invalid token" };
    }
  }
};

export const verifyRefreshToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const payload = { id: decoded.id };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET_ACCESS, { expiresIn: "1200s" });
    return { accessToken };
  } catch (error) {
    return { error: error.message };
  }
};
