import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { AppError } from "../utils/AppError.js";

const prisma = new PrismaClient();

export const registerUser = async (username, email, password, phoneNumber, address, requestedRole="CUSTOMER" ) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError("User already exists", 409);
    }
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
            phoneNumber,
            address,
            userRoles: {
                create: {
                    role: {
                        connectOrCreate: {
                            where: { role: requestedRole },
                            create: { role: requestedRole },
                        },
                    },
                },
            },
        },
        include: { userRoles: { include: { role: true } } },
    });
    return { id: user.id, email: user.email, username: user.username, phoneNumber: user.phoneNumber, address: user.address, roles: user.userRoles.map((ur) => ur.role.role) };

};

export const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { userRoles: { include: { role: true } } }
    });
    if (!user) {
        throw new AppError("Invalid credentials", 401);
    }
    if (user.isBlocked){
        throw new AppError("User is blocked", 403);
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new AppError("Invalid credentials", 401);
    }
    const roles = user.userRoles.map((ur) => ur.role.role);
    const token = jwt.sign({ id: user.id, roles }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return { token, user: { id: user.id, email: user.email, username: user.username, phoneNumber: user.phoneNumber, address: user.address, roles } };
};

export const deleteUser = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new AppError("User not found", 404);
    }
    await prisma.user.delete({ where: { id: userId } });
    return { message: "User deleted successfully" };
}