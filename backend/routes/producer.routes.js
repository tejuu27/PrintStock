
const express = require("express");
const mongoose = require("mongoose");
const Producer = require("../models/Producer.model");
const StockTransaction = require("../models/StockTransaction.model");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// GET /api/producers - List active producers
// Both admins and workers can view producers.
router.get("/", async (req, res) => {
    try {
        const producers = await Producer.find({ isActive: true })
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: producers.length,
            producers,
        });
    } catch (error) {
        console.error("Fetch producers error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch producers",
        });
    }
});

// POST /api/producers - Admin only
router.post("/", authorizeRoles("admin"), async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Producer name is required",
            });
        }

        const producer = await Producer.create({
            name: name.trim(),
            phone: typeof phone === "string" ? phone.trim() : "",
            address: typeof address === "string" ? address.trim() : "",
        });

        return res.status(201).json({
            success: true,
            message: "Producer created successfully",
            producer,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A producer with this name already exists",
            });
        }

        console.error("Create producer error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to create producer",
        });
    }
});

// GET /api/producers/:id/history?period=30
// Both admins and workers can view purchase history.
router.get("/:id/history", async (req, res) => {
    try {
        const { id } = req.params;
        const { period = "30", start, end } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid producer ID",
            });
        }

        const producer = await Producer.findOne({
            _id: id,
            isActive: true,
        });

        if (!producer) {
            return res.status(404).json({
                success: false,
                message: "Producer not found",
            });
        }

        const filter = {
            producer: producer._id,
            type: "PURCHASE",
        };

        if (period === "custom") {
            if (!start || !end) {
                return res.status(400).json({
                    success: false,
                    message: "Start and end dates are required",
                });
            }

            const startDate = new Date(`${start}T00:00:00.000Z`);
            const endDate = new Date(`${end}T23:59:59.999Z`);

            if (
                Number.isNaN(startDate.getTime()) ||
                Number.isNaN(endDate.getTime()) ||
                startDate > endDate
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date range",
                });
            }

            filter.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };
        } else if (period !== "all") {
            const days = Number(period);

            if (![10, 30, 180, 365].includes(days)) {
                return res.status(400).json({
                    success: false,
                    message: "Period must be 10, 30, 180, 365, all, or custom",
                });
            }

            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - days);

            filter.createdAt = { $gte: fromDate };
        }

        const history = await StockTransaction.find(filter)
            .populate("product", "name unit")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            producer,
            count: history.length,
            history,
        });
    } catch (error) {
        console.error("Fetch producer history error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch producer purchase history",
        });
    }
});

module.exports = router;
