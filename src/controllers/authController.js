import { registerUser, loginUser, deleteUser } from '../services/authServices.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';

export const registerController = async (req, res) =>{
    try{
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }
        const { username, email, password, phoneNumber, address } = parsed.data;
        const user = await registerUser(username, email, password, phoneNumber, address);
        res.status(201).json({ message: "User registered successfully", user });
    }catch(error){
        res.status(400).json({ error: error.message });
    }
};

export const loginController = async (req, res) =>{
    try{
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }
        const { email, password } = parsed.data;
        const result = await loginUser(email, password);
        res.status(200).json({ message: "User logged in successfully", token: result.token });
    }catch(error){
        res.status(401).json({ error: error.message });
    }
};

export const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteUser(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};