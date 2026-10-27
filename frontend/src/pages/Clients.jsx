
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://printstock.onrender.com/api";

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("printstock_token");

    if (!token) {
        window.location.href = "/";
        throw new Error("Please log in again.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (response.status === 401) {
        localStorage.removeItem("printstock_token");
        localStorage.removeItem("printstock_user");
        window.location.href = "/";
        throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}


function Clients() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        name: "",
        type: "",
        phone: "",
        address: "",
    });

    const [selectedClient, setSelectedClient] = useState("");
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPeriod, setHistoryPeriod] = useState("30");
    const [historyStart, setHistoryStart] = useState("");
    const [historyEnd, setHistoryEnd] = useState("");
    const [historySearched, setHistorySearched] = useState(false);

    async function fetchClients() {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch(API);
            setClients(data.clients || []);
        } catch (err) {
            setError(err.message || "Failed to load clients.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchClients();
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

        const data = await apiFetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        setSuccess("Client saved successfully!");

        setForm({
            name: "",
            type: "",
            phone: "",
            address: "",
        });

        await fetchClients();
        setShowAddForm(false);
    } catch (err) {
        setError(err.message || "Could not save the client.");
    } finally {
        setSaving(false);
    }
}

    async function fetchClientHistory(event) {
    if (event) {
        event.preventDefault();
    }

    if (!selectedClient) {
        setError("Please select a client first.");
        return;
    }

    if (
        historyPeriod === "custom" &&
        (!historyStart || !historyEnd)
    ) {
        setError("Please select both the start and end dates.");
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
        setError("");
        setHistory([]);
        setHistorySearched(false);

        const params = new URLSearchParams({
            period: historyPeriod,
        });

        if (historyPeriod === "custom") {
            params.set("start", historyStart);
            params.set("end", historyEnd);
        }

        const data = await apiFetch(
            `${API}/${selectedClient}/history?${params.toString()}`
        );

        setHistory(data.history || []);
        setHistorySearched(true);
    } catch (err) {
        setError(err.message || "Could not load client history.");
    } finally {
        setHistoryLoading(false);
    }
}
    function handlePeriodChange(event) {
        setHistoryPeriod(event.target.value);
        setHistoryStart("");
        setHistoryEnd("");
        setHistory([]);
        setHistorySearched(false);
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

    function getProductName(transaction) {
        if (transaction.product && typeof transaction.product === "object") {
            return transaction.product.name || "Unknown material";
        }

        return "Unknown material";
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>PrintStock</h1>
                    <p>Manage your printing customers</p>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="page-heading">
                    <div className="page-heading-text">
                        <span className="eyebrow">
                            CUSTOMER MANAGEMENT
                        </span>

                        <h2>Clients</h2>

                        <p>
                            Manage your printing customers and review
                            their activity.
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
                            {showAddForm ? "Cancel" : "+ Add Client"}
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
                    <p role="alert" className="error-message">
                        {error}
                    </p>
                )}

                {success && (
                    <p role="status" className="success-message">
                        {success}
                    </p>
                )}

                {showAddForm && (
                    <section className="dashboard-card">
                        <h3>Add New Client</h3>

                        <p>
                            Enter the details of the customer you work with.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="clientName">
                                    Client Name
                                </label>

                                <input
                                    id="clientName"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. St Mary's PU College"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="clientType">
                                    Client Type
                                </label>

                                <input
                                    id="clientType"
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    placeholder="e.g. College, Hospital, Bank"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="clientPhone">
                                    Phone
                                </label>

                                <input
                                    id="clientPhone"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="clientAddress">
                                    Address
                                </label>

                                <input
                                    id="clientAddress"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                />
                            </div>

                            <button type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Client"}
                            </button>
                        </form>
                    </section>
                )}

                <section className="dashboard-card">
                    <h3>Saved Clients</h3>

                    {loading ? (
                        <p>Loading clients...</p>
                    ) : clients.length === 0 ? (
                        <p>No clients found. Add your first client.</p>
                    ) : (
                        <>
                            <p>Total clients: {clients.length}</p>

                            <div className="clients-list">
                                {clients.map((client) => (
                                    <div
                                        className="client-item"
                                        key={client._id}
                                    >
                                        <div className="client-item-header">
                                            <div>
                                                <h4>{client.name}</h4>

                                                <span className="client-type">
                                                    {client.type}
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
                                                    {client.phone ||
                                                        "Not provided"}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="detail-label">
                                                    ADDRESS
                                                </span>

                                                <p>
                                                    {client.address ||
                                                        "Not provided"}
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
                            <span className="eyebrow">
                                ACTIVITY RECORDS
                            </span>

                            <h3>Client History</h3>

                            <p>
                                Review material usage recorded for each
                                customer.
                            </p>
                        </div>

                        <form onSubmit={fetchClientHistory}>
                            <div className="form-group">
                                <label htmlFor="selectedClient">
                                    Select Client
                                </label>

                                <select
                                    id="selectedClient"
                                    value={selectedClient}
                                    onChange={(event) => {
                                        setSelectedClient(event.target.value);
                                        setHistory([]);
                                        setHistorySearched(false);
                                        setError("");
                                    }}
                                    required
                                >
                                    <option value="">
                                        Choose a client
                                    </option>

                                    {clients.map((client) => (
                                        <option
                                            key={client._id}
                                            value={client._id}
                                        >
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="historyPeriod">
                                    Date Range
                                </label>

                                <select
                                    id="historyPeriod"
                                    value={historyPeriod}
                                    onChange={handlePeriodChange}
                                >
                                    <option value="10">
                                        Last 10 days
                                    </option>

                                    <option value="30">
                                        Last 1 month
                                    </option>

                                    <option value="180">
                                        Last 6 months
                                    </option>

                                    <option value="365">
                                        Last 1 year
                                    </option>

                                    <option value="all">
                                        All history
                                    </option>

                                    <option value="custom">
                                        Custom range
                                    </option>
                                </select>
                            </div>

                            {historyPeriod === "custom" && (
                                <div className="date-range-fields">
                                    <div className="form-group">
                                        <label htmlFor="historyStart">
                                            From
                                        </label>

                                        <input
                                            id="historyStart"
                                            type="date"
                                            value={historyStart}
                                            max={historyEnd || undefined}
                                            onChange={(event) =>
                                                setHistoryStart(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="historyEnd">
                                            To
                                        </label>

                                        <input
                                            id="historyEnd"
                                            type="date"
                                            value={historyEnd}
                                            min={historyStart || undefined}
                                            onChange={(event) =>
                                                setHistoryEnd(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={historyLoading}
                            >
                                {historyLoading
                                    ? "Loading History..."
                                    : "Show History"}
                            </button>
                        </form>

                        {historyLoading && (
                            <p>Fetching usage records...</p>
                        )}

                        {!historyLoading &&
                            historySearched &&
                            history.length === 0 && (
                                <div className="history-empty-state">
                                    <h4>No usage records found</h4>
                                    <p>
                                        No material usage was recorded for
                                        this client during the selected period.
                                    </p>
                                </div>
                            )}


                        {!historyLoading && history.length > 0 && (
                            <div className="history-results">
                                <div className="history-results-header">
                                    <div>
                                        <span className="eyebrow">TRANSACTION SUMMARY</span>
                                        <h4>Material Usage</h4>
                                        <p>Recorded printing work for the selected client.</p>
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
                                                <span>📄</span>
                                            </div>

                                            <div className="history-record-main">
                                                <div className="history-record-title">
                                                    <h5>{getProductName(transaction)}</h5>
                                                    <span className="usage-badge">Material Used</span>
                                                </div>

                                                <p className="history-record-purpose">
                                                    {transaction.purpose ||
                                                        transaction.notes ||
                                                        "No purpose specified"}
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

export default Clients;
