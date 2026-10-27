
const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        type: {
            type: String,
            enum: ["PURCHASE", "USAGE"],
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 0.001,
        },

        unit: {
            type: String,
            required: true,
            enum: ["bundle", "kg", "sheet", "ream", "piece"],
        },

        producer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Producer",
            default: null,
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            default: null,
        },

        purpose: {
            type: String,
            trim: true,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "StockTransaction",
    stockTransactionSchema
);
