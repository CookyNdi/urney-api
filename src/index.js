import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/Users.js";
import outlaysRoutes from "./routes/Outlays.js";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(fileUpload());
app.use(express.static("./src/public"));
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.use(userRoutes);
app.use(outlaysRoutes);

app.listen(PORT, () => {
  console.log(`server up and running perfectly at port ${PORT}`);
});
