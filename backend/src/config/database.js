import mongoose from "mongoose";

export const DatabaseConnection = async () => {
    try {
        const DB_URL = process.env.DB_URL;
        const DB_NAME = process.env.DB_NAME;
        await mongoose.connect(`${ DB_URL }${ DB_NAME }`);
        console.log("Database Connected Successfully")
    }
    catch (error) {
        console.error("Connection Failed")
    }
}
