
const express = require("express");
const mongoose = require("mongoose");
const Client = require("../models/Client.model");
const StockTransaction = require("../models/StockTransaction.model");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// GET /api/clients - Admin and worker
router.get("/", async (req, res) => {
    try {
        const clients = await Client.find({
            isActive: true,
        }).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: clients.length,
            clients,
        });
    } catch (error) {
        console.error("Fetch clients error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch clients",
        });
    }
});

// POST /api/clients - Admin only
router.post("/", authorizeRoles("admin"), async (req, res) => {
    try {
        const { name, type, phone, address } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof type !== "string" ||
            !type.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Client name and type are required",
            });
        }

        const client = await Client.create({
            name: name.trim(),
            type: type.trim(),
            phone: typeof phone === "string" ? phone.trim() : "",
            address: typeof address === "string" ? address.trim() : "",
        });

        return res.status(201).json({
            success: true,
            message: "Client created successfully",
            client,
        });
    } catch (error) {
        console.error("Create client error:", error.message);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A client with these details already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create client",
        });
    }
});

// GET /api/clients/:id/history - Admin and worker
router.get("/:id/history", async (req, res) => {
    try {
        const { id } = req.params;
        const { period = "30", start, end } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid client ID",
            });
        }

        const client = await Client.findOne({
            _id: id,
            isActive: true,
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const filter = {
            client: client._id,
            type: "USAGE",
        };

        if (period === "custom") {
            if (!start || !end) {
                return res.status(400).json({
                    success: false,
                    message: "Start and end dates are required for custom history",
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
            client,
            count: history.length,
            history,
        });
    } catch (error) {
        console.error("Client history error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch client history",
        });
    }
});

module.exports = router;
