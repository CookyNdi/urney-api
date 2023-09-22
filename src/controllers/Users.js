import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import path from "path";
import fs from "fs";
import { emailCheck, usernameCheck, passwordCheck } from "../utils/utils.js";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../helpers/jwtConfig.js";

const prisma = new PrismaClient();

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        income: true,
        image: true,
        image_url: true,
        createdAt: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        income: true,
        image: true,
        image_url: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, confPassword } = req.body;
    const usernameCheckResult = await usernameCheck(username);
    if (!usernameCheckResult.valid) {
      return res.status(400).json(usernameCheckResult);
    }
    const emailCheckResult = await emailCheck(email);
    if (!emailCheckResult.valid) {
      return res.status(400).json(emailCheckResult);
    }
    const passwordCheckResult = await passwordCheck(password, confPassword);
    if (!passwordCheckResult.valid) {
      return res.status(400).json(passwordCheckResult);
    }
    const hashedPassword = await argon2.hash(password);
    const file = req.files.file;
    if (!file) {
      return res.status(422).json({ msg: "No image uploaded" });
    }
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    const fileName = `${file.md5}${ext}`;
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
    const allowedTypes = [".png", ".jpg", ".jpeg", ".webp"];
    if (!allowedTypes.includes(ext.toLowerCase())) {
      return res.status(422).json({ msg: "Invalid image" });
    }
    if (fileSize > 1000000) {
      return res.status(422).json({ msg: "Image must be less than 1mb" });
    }
    file.mv(`./src/public/images/${fileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }
      await prisma.users.create({
        data: {
          username,
          email,
          password: hashedPassword,
          income: 0,
          image: fileName,
          image_url: url,
        },
      });
      res.status(200).json({ msg: "Account created" });
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateUserImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let fileName;
    if (!req.files) {
      fileName = user.image;
    } else {
      const file = req.files.file;
      const fileSize = file.data.length;
      const ext = path.extname(file.name);
      fileName = `${file.md5}${ext}`;
      const allowedTypes = [".png", ".jpg", ".jpeg", ".webp"];
      if (!allowedTypes.includes(ext.toLowerCase())) {
        return res.status(422).json({ msg: "Invalid Images" });
      }
      if (fileSize > 1000000) {
        return res.status(422).json({ msg: "Image must be less than 1mb" });
      }
      const filePath = `./src/public/images/${user.image}`;
      fs.unlinkSync(filePath);
      file.mv(`./src/public/images/${fileName}`, (err) => {
        if (err) {
          return res.status(500).json({ msg: err.message });
        }
      });
    }
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
    await prisma.users.update({
      where: { id: user.id },
      data: {
        image: fileName,
        image_url: url,
      },
    });
    res.status(200).json({ msg: "Profile Image Updated" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateUsername = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (!username) {
      return res.status(400).json({ msg: "Please fill the username" });
    }
    const usernameCheckResult = await usernameCheck(username);
    if (!usernameCheckResult.valid) {
      return res.status(400).json(usernameCheckResult);
    }
    const passwordMatch = await argon2.verify(user.password, password);
    if (!passwordMatch) {
      return res.status(400).json({ msg: "The password you entered is incorrect" });
    }
    await prisma.users.update({
      where: { id: user.id },
      data: { username },
    });
    return res.status(200).json({ msg: "Username updated successfully" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const updateUserEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (!email) {
      return res.status(400).json({ msg: "Please fill the email" });
    }
    const emailCheckResult = await emailCheck(email);
    if (!emailCheckResult.valid) {
      return res.status(400).json(emailCheckResult);
    }
    const passwordMatch = await argon2.verify(user.password, password);
    if (!passwordMatch) {
      return res.status(400).json({ msg: "The password you entered is incorrect" });
    }
    await prisma.users.update({
      where: { id: user.id },
      data: { email },
    });
    return res.status(200).json({ msg: "email updated successfully" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const updateUserPassword = async (req, res, next) => {
  try {
    const { password, confPassword, oldPassword } = req.body;
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (!password && !confPassword) {
      return res.status(400).json({ msg: "Please fill the password" });
    }
    const passwordCheckResult = await passwordCheck(password, confPassword);
    if (!passwordCheckResult.valid) {
      return res.status(400).json(passwordCheckResult);
    }
    const passwordMatch = await argon2.verify(user.password, oldPassword);
    if (!passwordMatch) {
      return res.status(400).json({ msg: "The password you entered is incorrect" });
    }
    const hashPassword = await argon2.hash(password);
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashPassword },
    });
    return res.status(200).json({ msg: "password updated successfully" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await prisma.users.delete({ where: { id: user.id } });
    res.status(200).json({ msg: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const addIncome = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const user = await prisma.users.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await prisma.users.update({
      where: { id: user.id },
      data: { income: user.income + amount },
    });
    res.status(200).json({ msg: "Income added successfully" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.users.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ msg: "Username not registered" });
    }
    const passwordMatch = await argon2.verify(user.password, password);
    if (!passwordMatch) {
      return res.status(400).json({ msg: "Incorrect password" });
    }
    const payload = {
      id: user.id,
    };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);
    // Atur cookie access token
    res.cookie("access_token", accessToken, {
      maxAge: 1200,
      httpOnly: true,
      // secure: true, // Hanya akan dikirim melalui HTTPS jika true
      // sameSite: "strict", // Atur ke 'lax' atau 'none' sesuai kebutuhan
    });

    // Atur cookie refresh token
    res.cookie("refresh_token", refreshToken, {
      maxAge: 604800000,
      httpOnly: true,
      // secure: true,
      // sameSite: "strict",
    });

    res.status(200).json({ msg: `Login Successfully` });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const token = async (req, res, next) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ msg: "Please Login First!!" });
  }
  const accessToken = verifyRefreshToken(refreshToken);
  res.cookie("access_token", accessToken, {
    maxAge: 1200,
    httpOnly: true,
  });
  res.status(200).json({ msg: "Token Renewed" });
};
