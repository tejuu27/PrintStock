
const express = require("express");
const Inventory = require("../models/Inventory.model");

const router = express.Router();

// GET /api/inventory - Get all inventory records
router.get("/", async (req, res) => {
    try {
        const inventory = await Inventory.find()
            .populate("product", "name description unit isActive")
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: inventory.length,
            inventory,
        });
    } catch (error) {
        console.error("Fetch inventory error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch inventory",
        });
    }
});

// GET /api/inventory/:productId - Get inventory for one product
router.get("/:productId", async (req, res) => {
    try {
        const { productId } = req.params;

        if (!/^[a-fA-F0-9]{24}$/.test(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const inventory = await Inventory.findOne({
            product: productId,
        }).populate("product", "name description unit isActive");

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory record not found",
            });
        }

        res.status(200).json({
            success: true,
            inventory,
        });
    } catch (error) {
        console.error("Fetch product inventory error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product inventory",
        });
    }
});

module.exports = router;
