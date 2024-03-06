import dotenv from "dotenv";
import connectToDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./env",
});

connectToDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`App is listening at PORT : ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log(`MongoDB connection Failed, ${err}`);
    });
