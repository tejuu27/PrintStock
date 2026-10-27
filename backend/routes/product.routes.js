
const express = require("express");
const Product = require("../models/Product.model");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// GET /api/products - Admin and worker can view active products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("Fetch products error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
});

// POST /api/products - Admin only
router.post("/", authorizeRoles("admin"), async (req, res) => {
    try {
        const { name, description, unit } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof unit !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Product name and unit are required",
            });
        }

        const allowedUnits = [
            "bundle",
            "kg",
            "sheet",
            "ream",
            "piece",
        ];

        if (!allowedUnits.includes(unit)) {
            return res.status(400).json({
                success: false,
                message: "Invalid unit",
            });
        }

        const product = await Product.create({
            name: name.trim(),
            description:
                typeof description === "string" ? description.trim() : "",
            unit,
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        console.error("Create product error:", error.message);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create product",
        });
    }
});

module.exports = router;
