import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { AppError } from "../utils/appError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { hashToken } from "../utils/hashToken.js";

const prisma = new PrismaClient();

export const registerUser = async (username, email, password, phoneNumber, address, requestedRole = "CUSTOMER") => {
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
        include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new AppError('Invalid credentials', 401);
    if (user.isBlocked) throw new AppError('This account has been blocked', 403);
    if (user.isDeleted) throw new AppError('This account has been deactivated', 403);

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    const roles = user.userRoles.map((ur) => ur.role.role);
    const accessToken = generateAccessToken(user, roles);

    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(refreshToken),
            userId: user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });

    return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, username: user.username, phoneNumber: user.phoneNumber, address: user.address, roles },
    };
};

export const refreshAccessToken = async (rawToken) => {
    if (!rawToken) throw new AppError('No refresh token provided', 401);

    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
        throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
        where: { id: stored.userId },
        include: { userRoles: { include: { role: true } } },
    });
    if (!user || user.isBlocked || user.isDeleted) throw new AppError('Invalid or expired refresh token', 401);

    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const roles = user.userRoles.map((ur) => ur.role.role);
    const newAccessToken = generateAccessToken(user, roles);
    const newRefreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(newRefreshToken),
            userId: user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (rawToken) => {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
};

export const deleteUser = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new AppError("User not found", 404);
    }
    await prisma.user.delete({ where: { id: userId } });
    return { message: "User deleted successfully" };
}

export const updateProfile = async (userId, data) => {
    const updated = await prisma.user.update({
        where: { id: userId },
        data: { username: data.username, phoneNumber: data.phoneNumber, address: data.address },
        include: { userRoles: { include: { role: true } } },
    });
    const roles = updated.userRoles.map((ur) => ur.role.role);
    return { id: updated.id, email: updated.email, username: updated.username, phoneNumber: updated.phoneNumber, address: updated.address, roles };
};

export const deactivateAccount = async (userId) => {
  await prisma.user.update({ where: { id: userId }, data: { isDeleted: true } });
  await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
  return { message: 'Account deactivated' };
};

export const deleteAccountPermanently = async (userId) => {
  try {
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'Account permanently deleted' };
  } catch (err) {
    if (err.code === 'P2003') {
      throw new AppError(
        'This account cannot be permanently deleted because it has order or restaurant history tied to it. Please deactivate instead.',
        409
      );
    }
    throw err;
  }
};