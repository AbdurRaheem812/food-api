import { registerUser, loginUser, deleteUser } from '../services/authServices.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const registerController = asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError('Validation error', 400, parsed.error.issues);
    }
    const { username, email, password, phoneNumber, address, role } = parsed.data;
    const user = await registerUser(username, email, password, phoneNumber, address, role);
    sendSuccess(res, 201, { message: 'User registered successfully', user });
});

export const loginController = asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError('Validation error', 400, parsed.error.issues);
    }
    const { email, password } = parsed.data;
    const result = await loginUser(email, password);
    sendSuccess(res, 200, { message: 'User logged in successfully', token: result.token, user: result.user });
});

export const deleteUserController = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await deleteUser(id);
    sendSuccess(res, 200, result);
});