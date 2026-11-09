
import bcrypt from "bcrypt";
import User from "../model/user.model.js";
import jwt from "jsonwebtoken";


// CUSTOMER REGISTRATION
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const normalemail = email.trim().toLowerCase();

        const existemail = await User.findOne({
            email: normalemail
        });

        if (existemail) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        const hashpassword = await bcrypt.hash(password, 12);

        const newuser = await User.create({
            name,
            email: normalemail,
            password: hashpassword,
            role: "customer"
        });

        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            user: {
                id: newuser._id,
                name: newuser.name,
                email: newuser.email,
                role: newuser.role
            }
        });

    } catch (error) {
        console.error("Register error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
};


// COMMON LOGIN FOR CUSTOMER, SELLER AND ADMIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalemail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalemail
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
};
