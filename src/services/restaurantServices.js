import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

const prisma = new PrismaClient();

export const applyAsRestaurantOwner = async (userId, data) => {
  const existing = await prisma.restaurant.findFirst({ where: { userId } });

  if (existing && existing.applicationStatus !== 'REJECTED') {
    throw new AppError('You have already submitted a restaurant application', 409);
  }

  const restaurantFields = {
    name: data.name,
    description: data.description,
    address: data.address,
    deliveryFee: data.deliveryFee,
    minimumOrder: data.minimumOrder,
    openTime: new Date(`1970-01-01T${data.openTime}:00Z`),
    closeTime: new Date(`1970-01-01T${data.closeTime}:00Z`),
    applicationStatus: 'PENDING',
    rejectionReason: null,
  };

  if (existing) {
    const restaurant = await prisma.restaurant.update({
      where: { id: existing.id },
      data: {
        ...restaurantFields,
        restaurantCuisines: {
          deleteMany: {},
          create: data.cuisines.map((name) => ({
            cuisine: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        },
      },
      include: { restaurantCuisines: { include: { cuisine: true } } },
    });
    return restaurant;
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      userId,
      ...restaurantFields,
      restaurantCuisines: {
        create: data.cuisines.map((name) => ({
          cuisine: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
    },
    include: { restaurantCuisines: { include: { cuisine: true } } },
  });

  return restaurant;
};

const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'foodhub/restaurant-logos' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const uploadRestaurantLogo = async (ownerId, fileBuffer) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { userId: ownerId } });
  if (!restaurant) {
    throw new AppError('No restaurant application found for this account', 404);
  }

  const result = await streamUpload(fileBuffer);

  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { logoUrl: result.secure_url },
  });

  return updated;
};

export const getMyApplicationStatus = async (userId) => {
  const restaurant = await prisma.restaurant.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      applicationStatus: true,
      rejectionReason: true,
      logoUrl: true,
    },
  });

  if (!restaurant) {
    throw new AppError('No restaurant application found for this account', 404);
  }

  return restaurant;
};