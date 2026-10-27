
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const User = require("./models/User.model");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const name = (await ask("Admin name: ")).trim();
        const username = (
            await ask("Admin username: ")
        ).trim().toLowerCase();
        const password = await ask("Admin password (min 8 chars): ");

        if (!name || !username || password.length < 8) {
            throw new Error(
                "Name and username are required; password must be at least 8 characters."
            );
        }

        const existing = await User.findOne({ username });

        if (existing) {
            throw new Error("That username already exists.");
        }

        // User model hashes the password automatically.
        await User.create({
            name,
            username,
            password,
            role: "admin",
        });

        console.log("Admin account created successfully.");
    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
        await mongoose.disconnect();
    }
}

main();
