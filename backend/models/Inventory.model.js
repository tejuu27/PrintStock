
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            unique: true,
        },

        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },

        unit: {
            type: String,
            required: true,
            enum: ["bundle", "kg", "sheet", "ream", "piece"],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Inventory", inventorySchema);
