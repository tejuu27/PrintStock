
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5001/api/producers";


async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("printstock_token");

    if (!token) {
        window.location.href = "/";
        throw new Error("Please log in to continue.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status === 401) {
        localStorage.removeItem("printstock_token");
        localStorage.removeItem("printstock_user");
        window.location.href = "/";
        throw new Error("Your session expired. Please log in again.");
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        throw new Error("The server returned an unexpected response. Check the backend.");
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}


function Producers() {
    const [producers, setProducers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showAddForm, setShowAddForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
    });

    const [selectedProducer, setSelectedProducer] = useState("");
    const [historyPeriod, setHistoryPeriod] = useState("30");
    const [historyStart, setHistoryStart] = useState("");
    const [historyEnd, setHistoryEnd] = useState("");
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearched, setHistorySearched] = useState(false);

    async function fetchProducers() {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch(API_URL);
            setProducers(data.producers || []);
        } catch (err) {
            setError(err.message || "Failed to load producers.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducers();
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await apiFetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    address: form.address.trim(),
                }),
            });

            setSuccess("Producer added successfully!");
            setForm({
                name: "",
                phone: "",
                address: "",
            });

            await fetchProducers();
            setShowAddForm(false);
        } catch (err) {
            setError(err.message || "Could not save producer.");
        } finally {
            setSaving(false);
        }
    }

    async function fetchPurchaseHistory(event) {
        event.preventDefault();

        if (!selectedProducer) {
            setError("Please select a producer.");
            return;
        }

        if (
            historyPeriod === "custom" &&
            (!historyStart || !historyEnd)
        ) {
            setError("Please select both dates.");
            return;
        }

        if (
            historyPeriod === "custom" &&
            historyStart > historyEnd
        ) {
            setError("The start date cannot be after the end date.");
            return;
        }

        try {
            setHistoryLoading(true);
            setHistory([]);
            setHistorySearched(false);
            setError("");
            setSuccess("");

            const params = new URLSearchParams({
                period: historyPeriod,
            });

            if (historyPeriod === "custom") {
                params.set("start", historyStart);
                params.set("end", historyEnd);
            }

            const data = await apiFetch(
                `${API_URL}/${selectedProducer}/history?${params.toString()}`
            );

            setHistory(data.history || []);
            setHistorySearched(true);
        } catch (err) {
            setError(err.message || "Could not load purchase history.");
        } finally {
            setHistoryLoading(false);
        }
    }

    function formatDate(dateValue) {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>PrintStock</h1>
                    <p>Manage your paper and material suppliers</p>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="page-heading">
                    <div className="page-heading-text">
                        <span className="eyebrow">SUPPLIER MANAGEMENT</span>
                        <h2>Producers</h2>
                        <p>
                            Manage producers and review incoming stock purchases.
                        </p>
                    </div>

                    <div className="page-actions">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddForm(!showAddForm);
                                setShowHistory(false);
                                setError("");
                                setSuccess("");
                            }}
                        >
                            {showAddForm ? "Cancel" : "+ Add Producer"}
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                setShowHistory(!showHistory);
                                setShowAddForm(false);
                                setError("");
                                setSuccess("");
                            }}
                        >
                            {showHistory ? "Hide History" : "View History"}
                        </button>
                    </div>
                </div>

                {error && (
                    <p role="alert" className="error-message">{error}</p>
                )}

                {success && (
                    <p role="status" className="success-message">{success}</p>
                )}

                {showAddForm && (
                    <section className="dashboard-card">
                        <h3>Add New Producer</h3>
                        <p>Enter the supplier's contact information.</p>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="producerName">Producer Name</label>
                                <input
                                    id="producerName"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Durga Paper Mart"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="producerPhone">Phone</label>
                                <input
                                    id="producerPhone"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="producerAddress">Address</label>
                                <input
                                    id="producerAddress"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                />
                            </div>

                            <button type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Producer"}
                            </button>
                        </form>
                    </section>
                )}

                <section className="dashboard-card">
                    <h3>Saved Producers</h3>

                    {loading ? (
                        <p>Loading producers...</p>
                    ) : producers.length === 0 ? (
                        <p>No producers found. Add your first producer.</p>
                    ) : (
                        <>
                            <p>Total producers: {producers.length}</p>

                            <div className="clients-list">
                                {producers.map((producer) => (
                                    <div
                                        className="client-item"
                                        key={producer._id}
                                    >
                                        <div className="client-item-header">
                                            <div>
                                                <h4>{producer.name}</h4>
                                                <span className="client-type">
                                                    Material Supplier
                                                </span>
                                            </div>

                                            <span className="client-status">
                                                Active
                                            </span>
                                        </div>

                                        <div className="client-details">
                                            <div>
                                                <span className="detail-label">
                                                    PHONE
                                                </span>
                                                <p>
                                                    {producer.phone || "Not provided"}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="detail-label">
                                                    ADDRESS
                                                </span>
                                                <p>
                                                    {producer.address || "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {showHistory && (
                    <section className="dashboard-card history-card">
                        <div className="history-heading">
                            <span className="eyebrow">PURCHASE RECORDS</span>
                            <h3>Producer Purchase History</h3>
                            <p>
                                Review materials purchased from each producer.
                            </p>
                        </div>

                        <form onSubmit={fetchPurchaseHistory}>
                            <div className="form-group">
                                <label htmlFor="selectedProducer">
                                    Select Producer
                                </label>

                                <select
                                    id="selectedProducer"
                                    value={selectedProducer}
                                    onChange={(event) => {
                                        setSelectedProducer(event.target.value);
                                        setHistory([]);
                                        setHistorySearched(false);
                                        setError("");
                                    }}
                                    required
                                >
                                    <option value="">Choose a producer</option>

                                    {producers.map((producer) => (
                                        <option
                                            key={producer._id}
                                            value={producer._id}
                                        >
                                            {producer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="producerHistoryPeriod">
                                    Date Range
                                </label>

                                <select
                                    id="producerHistoryPeriod"
                                    value={historyPeriod}
                                    onChange={(event) => {
                                        setHistoryPeriod(event.target.value);
                                        setHistoryStart("");
                                        setHistoryEnd("");
                                        setHistory([]);
                                        setHistorySearched(false);
                                    }}
                                >
                                    <option value="10">Last 10 days</option>
                                    <option value="30">Last 1 month</option>
                                    <option value="180">Last 6 months</option>
                                    <option value="365">Last 1 year</option>
                                    <option value="all">All history</option>
                                    <option value="custom">Custom range</option>
                                </select>
                            </div>

                            {historyPeriod === "custom" && (
                                <div className="date-range-fields">
                                    <div className="form-group">
                                        <label htmlFor="producerHistoryStart">
                                            From
                                        </label>

                                        <input
                                            id="producerHistoryStart"
                                            type="date"
                                            value={historyStart}
                                            max={historyEnd || undefined}
                                            onChange={(event) =>
                                                setHistoryStart(event.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="producerHistoryEnd">
                                            To
                                        </label>

                                        <input
                                            id="producerHistoryEnd"
                                            type="date"
                                            value={historyEnd}
                                            min={historyStart || undefined}
                                            onChange={(event) =>
                                                setHistoryEnd(event.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={historyLoading}>
                                {historyLoading
                                    ? "Loading History..."
                                    : "Show History"}
                            </button>
                        </form>

                        {historyLoading && <p>Fetching purchase records...</p>}

                        {!historyLoading &&
                            historySearched &&
                            history.length === 0 && (
                                <div className="history-empty-state">
                                    <h4>No purchases found</h4>
                                    <p>
                                        No purchases were recorded for this producer
                                        during the selected period.
                                    </p>
                                </div>
                            )}

                        {!historyLoading && history.length > 0 && (
                            <div className="history-results">
                                <div className="history-results-header">
                                    <div>
                                        <span className="eyebrow">
                                            TRANSACTION SUMMARY
                                        </span>
                                        <h4>Incoming Materials</h4>
                                        <p>
                                            Purchases from the selected producer.
                                        </p>
                                    </div>

                                    <div className="history-count">
                                        <span>RECORDS</span>
                                        <strong>{history.length}</strong>
                                    </div>
                                </div>

                                <div className="history-record-list">
                                    {history.map((transaction) => (
                                        <article
                                            className="history-record"
                                            key={transaction._id}
                                        >
                                            <div className="history-record-icon">
                                                <span>📦</span>
                                            </div>

                                            <div className="history-record-main">
                                                <div className="history-record-title">
                                                    <h5>
                                                        {transaction.product &&
                                                        typeof transaction.product === "object"
                                                            ? transaction.product.name
                                                            : "Unknown material"}
                                                    </h5>

                                                    <span className="usage-badge">
                                                        Stock Purchased
                                                    </span>
                                                </div>

                                                <p className="history-record-purpose">
                                                    {transaction.notes ||
                                                        "Incoming stock purchase"}
                                                </p>

                                                <span className="history-record-date">
                                                    {formatDate(transaction.createdAt)}
                                                </span>
                                            </div>

                                            <div className="history-record-quantity">
                                                <strong>{transaction.quantity}</strong>
                                                <span>
                                                    {transaction.unit ||
                                                        transaction.product?.unit ||
                                                        ""}
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

export default Producers;
