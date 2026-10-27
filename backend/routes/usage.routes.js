
const express = require("express");
const mongoose = require("mongoose");

const Product = require("../models/Product.model");
const Client = require("../models/Client.model");
const Inventory = require("../models/Inventory.model");
const StockTransaction = require("../models/StockTransaction.model");

const router = express.Router();

// POST /api/usage - Admin and worker
router.post("/", async (req, res) => {
    const { productId, clientId, quantity, purpose, notes } = req.body;

    if (
        !mongoose.isValidObjectId(productId) ||
        !mongoose.isValidObjectId(clientId) ||
        typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid product, client, and positive quantity are required",
        });
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const product = await Product.findOne({
                _id: productId,
                isActive: true,
            }).session(session);

            const client = await Client.findOne({
                _id: clientId,
                isActive: true,
            }).session(session);

            if (!product || !client) {
                const error = new Error("Active product or client not found");
                error.status = 404;
                throw error;
            }

            const inventory = await Inventory.findOne({
                product: productId,
            }).session(session);

            if (!inventory || inventory.unit !== product.unit) {
                const error = new Error("Inventory not found or unit mismatch");
                error.status = 400;
                throw error;
            }

            if (inventory.quantity < quantity) {
                const error = new Error("Insufficient stock available");
                error.status = 400;
                throw error;
            }

            inventory.quantity -= quantity;
            await inventory.save({ session });

            const [transaction] = await StockTransaction.create(
                [{
                    product: productId,
                    client: clientId,
                    type: "USAGE",
                    quantity,
                    unit: product.unit,
                    purpose: typeof purpose === "string" ? purpose.trim() : "",
                    notes: typeof notes === "string" ? notes.trim() : "",
                    recordedBy: req.user.id,
                }],
                { session }
            );

            result = { inventory, transaction };
        });

        return res.status(201).json({
            success: true,
            message: "Usage recorded and inventory updated",
            ...result,
        });
    } catch (error) {
        console.error("Usage error:", error.message);

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to record usage",
        });
    } finally {
        await session.endSession();
    }
});

module.exports = router;
