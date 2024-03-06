import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        console.log(
            `DB connected : HOST : ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.log(`DB connection ERROR, ${error}`);
        process.exit(1);
    }
};

export default connectToDB;
