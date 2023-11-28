import connectToDB from "./db/index.js";
import dotenv from "dotenv";

// require('dotenv').config()
dotenv.config({
  path: "./env",
});
connectToDB();

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
