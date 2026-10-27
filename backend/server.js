
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Load models
require("./models/Product.model");
require("./models/Inventory.model");
require("./models/StockTransaction.model");
require("./models/Producer.model");
require("./models/Client.model");
require("./models/User.model");


// Load routes
const productRoutes = require("./routes/product.routes");
const producerRoutes = require("./routes/producer.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const usageRoutes = require("./routes/usage.routes");
const clientRoutes = require("./routes/client.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const authRoutes = require("./routes/auth.routes");
const { protect, authorizeRoles } = require("./middleware/auth.middleware");

const app = express();



app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        /^https:\/\/print-stock[a-z0-9-]*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);



app.use(express.json());


 // Protect all API endpoints except authentication.

app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth")) {
        return next();
    }

    return protect(req, res, next);
});


// API routes
app.use("/api/products", productRoutes);
app.use("/api/producers", producerRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/auth", authRoutes);


app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "PrintStock API is running!",
        database:
            mongoose.connection.readyState === 1
                ? "Connected"
                : "Disconnected",
    });
});

async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from backend/.env");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Atlas connected successfully!");
        console.log("All six models loaded successfully!");

        const PORT = process.env.PORT || 5001;

        app.listen(PORT, () => {
            console.log(`PrintStock server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("PrintStock startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
