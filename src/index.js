import { app } from "./app.js";
import connectToDB from "./db/index.js";
import dotenv from "dotenv";

// require('dotenv').config()
dotenv.config({
  path: "./env",
});
connectToDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(`Express Error while connecting DB : ${error}`);
    });
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`Server is listening at the PORT : ${port}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection Failed! ${error}`);
  });

/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error:", error);
    });
    app.listen(process.env.PORT, () => {
      console.log(`Listening at the port : ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(`Error while connecting to DB : ${error}`);
    throw error;
  }
})();

*/
