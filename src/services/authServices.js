import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";

const prisma = new PrismaClient();

export const registerUser = async ( username, email, password, phoneNumber, address ) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error("User already exists");
    }
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
            phoneNumber,
            address
        }
    });
    return {  id: user.id, email: user.email, username: user.username, phoneNumber: user.phoneNumber, address: user.address };

};

export const loginUser = async ( email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return { token, user: { id: user.id, email: user.email, username: user.username, phoneNumber: user.phoneNumber, address: user.address } };
};

export const deleteUser = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }
    await prisma.user.delete({ where: { id: userId } });
    return { message: "User deleted successfully" };
}