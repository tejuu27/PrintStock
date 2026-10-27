
const express = require("express");
const mongoose = require("mongoose");

const Product = require("../models/Product.model");
const Producer = require("../models/Producer.model");
const Inventory = require("../models/Inventory.model");
const StockTransaction = require("../models/StockTransaction.model");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// POST /api/purchases
// Only admins can record incoming stock.
router.post("/", authorizeRoles("admin"), async (req, res) => {
    const { productId, producerId, quantity } = req.body;

    if (
        !mongoose.isValidObjectId(productId) ||
        !mongoose.isValidObjectId(producerId) ||
        typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid product, producer, and positive quantity are required",
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

            const producer = await Producer.findOne({
                _id: producerId,
                isActive: true,
            }).session(session);

            if (!product || !producer) {
                const error = new Error(
                    "Active product or producer not found"
                );
                error.status = 404;
                throw error;
            }

            let inventory = await Inventory.findOne({
                product: productId,
            }).session(session);

            if (!inventory) {
                [inventory] = await Inventory.create(
                    [{
                        product: productId,
                        quantity: 0,
                        unit: product.unit,
                    }],
                    { session }
                );
            }

            if (inventory.unit !== product.unit) {
                const error = new Error(
                    "Inventory unit does not match product unit"
                );
                error.status = 400;
                throw error;
            }

            inventory.quantity += quantity;
            await inventory.save({ session });

            const [transaction] = await StockTransaction.create(
                [{
                    product: productId,
                    producer: producerId,
                    type: "PURCHASE",
                    quantity,
                    unit: product.unit,
                    recordedBy: req.user.id,
                }],
                { session }
            );

            result = { inventory, transaction };
        });

        return res.status(201).json({
            success: true,
            message: "Purchase recorded and inventory updated",
            ...result,
        });
    } catch (error) {
        console.error("Purchase error:", error.message);

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to record purchase",
        });
    } finally {
        await session.endSession();
    }
});

module.exports = router;
