import { registerUser, loginUser, deleteUser } from '../services/authServices.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const registerController = async (req, res) =>{
    try{
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return sendError(res, 400, "Validation error", parsed.error.issues);
        }
        const { username, email, password, phoneNumber, address } = parsed.data;
        const user = await registerUser(username, email, password, phoneNumber, address);
        sendSuccess(res, 201, { message: "User registered successfully", user });
    }catch(error){
        sendError(res, 400, error.message);
    }
};

export const loginController = async (req, res) =>{
    try{
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return sendError(res, 400, "Validation error", parsed.error.issues);
        }
        const { email, password } = parsed.data;
        const result = await loginUser(email, password);
        sendSuccess(res, 200, { message: "User logged in successfully", token: result.token });
    }catch(error){
        sendError(res, 401, error.message);
    }
};

export const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteUser(id);
        sendSuccess(res, 200, result);
    } catch (error) {
        sendError(res, 404, error.message);
    }
};