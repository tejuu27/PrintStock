
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API || "http://localhost:5001/api";

export default function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Login failed.");
            }

            localStorage.setItem("printstock_token", data.token);
            localStorage.setItem(
                "printstock_user",
                JSON.stringify(data.user)
            );

            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(
                err.message || "Unable to connect to the server."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-brand-icon">P</div>
                <h1>PrintStock</h1>
                <p className="login-subtitle">
                    Printing Press Inventory Management
                </p>

                {error && (
                    <p className="login-error" role="alert">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="login-footer">
                    Simple stock management for your printing press.
                </p>
            </section>
        </main>
    );
}
