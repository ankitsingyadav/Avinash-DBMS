import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import connectDB from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import organisationRoutes from "./routes/organisation.routes.js";
import userManagementRoutes from "./routes/userManagement.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok", environment: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth",          authRoutes);
app.use("/api/v1/organisations", organisationRoutes);
app.use("/api/v1/users",         userManagementRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\nServer running at http://localhost:${PORT}`);
  });
};

startServer();