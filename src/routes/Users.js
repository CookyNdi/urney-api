import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  deleteUser,
  updateUserImage,
  updateUsername,
  updateUserEmail,
  updateUserPassword,
  addIncome,
  login,
  token,
} from "../controllers/Users.js";
import { authentication } from "../middleware/Access.js";

const route = express.Router();

route.get("/api/users", authentication, getUsers);
route.get("/api/users/:id", authentication, getUserById);
route.post("/api/registration", createUser);
route.patch("/api/users/update/username/:id", authentication, updateUsername);
route.patch("/api/users/update/email/:id", authentication, updateUserEmail);
route.patch("/api/users/update/password/:id", authentication, updateUserPassword);
route.patch("/api/users/update/image/:id", authentication, updateUserImage);
route.delete("/api/users/:id", authentication, deleteUser);
route.post("/api/users/income/:id", authentication, addIncome);

route.post("/api/login", login);
route.get("api/refresh", token);

export default route;
