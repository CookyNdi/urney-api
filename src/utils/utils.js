import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const usernameCheck = async (username) => {
  const existingUser = await prisma.users.findUnique({
    where: { username },
    select: { username: true },
  });
  return {
    valid: !existingUser,
    type: existingUser ? "Username Taken" : "",
    errorMessage: existingUser ? "This Username is Already Registered" : "",
  };
};

export const emailCheck = async (email) => {
  const validationResult = { valid: true, type: "", errorMessage: "" };
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email)) {
    validationResult.valid = false;
    validationResult.type = "Not Email";
    validationResult.errorMessage = `This is not a valid email: ${email}`;
  }
  const existingUser = await prisma.users.findUnique({
    where: { email },
    select: {
      email: true,
    },
  });
  if (existingUser) {
    validationResult.valid = false;
    validationResult.type = "Email Taken";
    validationResult.errorMessage = `This email is already registered: ${email}`;
  }
  return validationResult;
};

export const passwordCheck = async (password, confPassword) => {
  const validationResult = {
    valid: true,
    type: "",
    errorMessage: "",
  };
  if (password !== confPassword) {
    validationResult.valid = false;
    validationResult.type = "Password Not Match";
    validationResult.errorMessage = "Password and Confirm Password Do not Match";
  }
  const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Z!@#$%^&*].{7,}$/;
  if (!passwordPattern.test(password)) {
    validationResult.valid = false;
    validationResult.type = "Password Pattern";
    validationResult.errorMessage =
      "The password must be at least 8 characters long, contain a capital initial letter, and must have at least one symbol,";
  }
  return validationResult;
};

export const addDaysToCurrentDate = (daysToAdd) => {
  const currentDate = new Date(); 
  const futureDate = new Date(); 
  futureDate.setDate(currentDate.getDate() + daysToAdd); 
  return futureDate;
}