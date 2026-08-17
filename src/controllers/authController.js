import { registerUser, loginUser, deleteUser, refreshAccessToken, logoutUser, updateProfile, deactivateAccount, deleteAccountPermanently } from '../services/authServices.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, 
};

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

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, 200, { message: 'User logged in successfully', token: result.accessToken, user: result.user });
});

export const refreshController = asyncHandler(async (req, res) => {
    const rawToken = req.cookies.refreshToken;
    const result = await refreshAccessToken(rawToken);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, 200, { token: result.accessToken });
});

export const logoutController = asyncHandler(async (req, res) => {
    const rawToken = req.cookies.refreshToken;
    await logoutUser(rawToken);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, 200, { message: 'Logged out successfully' });
});

export const deleteUserController = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await deleteUser(id);
    sendSuccess(res, 200, result);
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user.id, req.body);
  sendSuccess(res, 200, { user });
});

export const deactivateAccountController = asyncHandler(async (req, res) => {
  const result = await deactivateAccount(req.user.id);
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, 200, result);
});

export const deleteAccountController = asyncHandler(async (req, res) => {
  const result = await deleteAccountPermanently(req.user.id);
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, 200, result);
});