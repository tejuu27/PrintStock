
import { useEffect, useState } from "react";
import Select from "react-select";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: "48px",
        borderRadius: "10px",
        borderColor: state.isFocused ? "#285640" : "#e5e7df",
        boxShadow: state.isFocused ? "0 0 0 2px #dce9df" : "none",
        "&:hover": { borderColor: "#285640" },
        backgroundColor: "#fffefa",
    }),
    menu: (base) => ({
        ...base,
        zIndex: 20,
        borderRadius: "10px",
        overflow: "hidden",
    }),
    menuList: (base) => ({
        ...base,
        maxHeight: "220px",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#285640"
            : state.isFocused
                ? "#edf3ec"
                : "#fffefa",
        color: state.isSelected ? "#ffffff" : "#2d4035",
        cursor: "pointer",
        padding: "11px 14px",
    }),
    placeholder: (base) => ({
        ...base,
        color: "#92998f",
    }),
};

function SearchSelect({
    options,
    value,
    onChange,
    placeholder,
    isDisabled = false,
}) {
    return (
        <Select
            options={options}
            value={options.find((option) => option.value === value) || null}
            onChange={(option) => onChange(option?.value || "")}
            placeholder={placeholder}
            isSearchable
            isClearable
            isDisabled={isDisabled}
            styles={selectStyles}
            noOptionsMessage={({ inputValue }) =>
                inputValue
                    ? `No results for "${inputValue}"`
                    : "No options available"
            }
        />
    );
}

function Stock() {
    const [products, setProducts] = useState([]);
    const [producers, setProducers] = useState([]);
    const [clients, setClients] = useState([]);
    const [inventory, setInventory] = useState([]);

    const [activeTab, setActiveTab] = useState("inventory");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [purchaseForm, setPurchaseForm] = useState({
        productId: "",
        producerId: "",
        quantity: "",
    });

    const [usageForm, setUsageForm] = useState({
        productId: "",
        clientId: "",
        quantity: "",
        purpose: "",
        notes: "",
    });

    async function getJson(url, options = {}) {
        const token = localStorage.getItem("printstock_token");
        const headers = {
            ...(options.headers || {}),
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        // Only set JSON content type when sending a body.
        if (options.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        const responseText = await response.text();
        let data;

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            throw new Error(
                `Server returned an unexpected response (HTTP ${response.status}). Check that the backend API is running.`
            );
        }

        if (response.status === 401) {
            localStorage.removeItem("printstock_token");
            localStorage.removeItem("printstock_user");
            window.location.href = "/";
            throw new Error("Your session expired. Please sign in again.");
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || `Request failed (HTTP ${response.status}).`);
        }

        return data;
    }

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [
                productData,
                producerData,
                clientData,
                inventoryData,
            ] = await Promise.all([
                getJson(`${API}/products`),
                getJson(`${API}/producers`),
                getJson(`${API}/clients`),
                getJson(`${API}/inventory`),
            ]);

            setProducts(productData.products || []);
            setProducers(producerData.producers || []);
            setClients(clientData.clients || []);
            setInventory(inventoryData.inventory || []);
        } catch (err) {
            setError(err.message || "Could not load stock information.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function updatePurchase(event) {
        const { name, value } = event.target;

        setPurchaseForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function updateUsage(event) {
        const { name, value } = event.target;

        setUsageForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function getAvailableQuantity(productId) {
        const record = inventory.find(
            (item) => item.product?._id === productId
        );

        return record?.quantity ?? 0;
    }

    function getProductUnit(productId) {
        return products.find((product) => product._id === productId)?.unit || "";
    }

    const productOptions = products.map((product) => ({
        value: product._id,
        label: `${product.name} (${product.unit})`,
    }));

    const producerOptions = producers.map((producer) => ({
        value: producer._id,
        label: producer.name,
    }));

    const clientOptions = clients.map((client) => ({
        value: client._id,
        label: `${client.name} — ${client.type}`,
    }));

    async function submitPurchase(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const quantity = Number(purchaseForm.quantity);

            if (!purchaseForm.productId || !purchaseForm.producerId) {
                throw new Error("Select both a material and a producer.");
            }

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error("Enter a quantity greater than zero.");
            }

            const data = await getJson(`${API}/purchases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: purchaseForm.productId,
                    producerId: purchaseForm.producerId,
                    quantity,
                }),
            });

            setSuccess(data.message || "Purchase recorded successfully.");

            setPurchaseForm({
                productId: "",
                producerId: "",
                quantity: "",
            });

            await loadData();
        } catch (err) {
            setError(err.message || "Could not record purchase.");
        } finally {
            setSaving(false);
        }
    }

    async function submitUsage(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const quantity = Number(usageForm.quantity);

            if (!usageForm.productId || !usageForm.clientId) {
                throw new Error("Select both a material and a client.");
            }

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error("Enter a quantity greater than zero.");
            }

            if (quantity > getAvailableQuantity(usageForm.productId)) {
                throw new Error("Quantity exceeds the available stock.");
            }

            const data = await getJson(`${API}/usage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: usageForm.productId,
                    clientId: usageForm.clientId,
                    quantity,
                    purpose: usageForm.purpose,
                    notes: usageForm.notes,
                }),
            });

            setSuccess(data.message || "Material usage recorded successfully.");

            setUsageForm({
                productId: "",
                clientId: "",
                quantity: "",
                purpose: "",
                notes: "",
            });

            await loadData();
        } catch (err) {
            setError(err.message || "Could not record material usage.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>PrintStock</h1>
                    <p>Track inventory and material movement</p>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="page-heading">
                    <div className="page-heading-text">
                        <span className="eyebrow">INVENTORY MANAGEMENT</span>
                        <h2>Stock Management</h2>
                        <p>
                            Check available materials, record purchases,
                            and track usage.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message" role="status">
                        {success}
                    </div>
                )}

                <div className="stock-tabs">
                    <button
                        type="button"
                        className={activeTab === "inventory" ? "active" : ""}
                        onClick={() => {
                            setActiveTab("inventory");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Current Stock
                    </button>

                    <button
                        type="button"
                        className={activeTab === "purchase" ? "active" : ""}
                        onClick={() => {
                            setActiveTab("purchase");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        + Incoming Stock
                    </button>

                    <button
                        type="button"
                        className={activeTab === "usage" ? "active" : ""}
                        onClick={() => {
                            setActiveTab("usage");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        − Record Usage
                    </button>
                </div>

                {loading ? (
                    <section className="dashboard-card">
                        <p>Loading inventory...</p>
                    </section>
                ) : (
                    <>
                        {activeTab === "inventory" && (
                            <section className="dashboard-card stock-inventory-card">
                                <div className="stock-section-heading">
                                    <div>
                                        <span className="eyebrow">STOCK OVERVIEW</span>
                                        <h3>Current Inventory</h3>
                                        <p>Available materials across all producers.</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="secondary-button stock-refresh-button"
                                        onClick={loadData}
                                        disabled={loading}
                                    >
                                        Refresh
                                    </button>
                                </div>

                                <div className="stock-summary">
                                    <div>
                                        <span>Material types</span>
                                        <strong>{inventory.length}</strong>
                                    </div>
                                    <div>
                                        <span>Items in stock</span>
                                        <strong>
                                            {inventory.filter((item) => item.quantity > 0).length}
                                        </strong>
                                    </div>
                                </div>

                                {inventory.length === 0 ? (
                                    <div className="history-empty-state">
                                        <h4>No stock recorded yet</h4>
                                        <p>Record an incoming purchase to add materials.</p>
                                    </div>
                                ) : (
                                    <div className="inventory-grid">
                                        {inventory.map((item) => (
                                            <article className="inventory-item" key={item._id}>
                                                <div className="inventory-item-top">
                                                    <div className="inventory-icon">📦</div>
                                                    <span className="client-status">
                                                        {item.product?.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </div>

                                                <h4>{item.product?.name || "Unknown material"}</h4>
                                                <p className="inventory-description">
                                                    {item.product?.description || "Printing material"}
                                                </p>

                                                <div className="inventory-stock-divider" />

                                                <div className="inventory-stock-bottom">
                                                    <div>
                                                        <span className="inventory-caption">
                                                            AVAILABLE QUANTITY
                                                        </span>
                                                        <div className="inventory-quantity">
                                                            <strong>{item.quantity}</strong>
                                                            <span>{item.unit}</span>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`stock-level ${
                                                            item.quantity === 0
                                                                ? "stock-empty"
                                                                : item.quantity <= 5
                                                                    ? "stock-low"
                                                                    : "stock-available"
                                                        }`}
                                                    >
                                                        {item.quantity === 0
                                                            ? "Out of stock"
                                                            : item.quantity <= 5
                                                                ? "Low stock"
                                                                : "In stock"}
                                                    </span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {activeTab === "purchase" && (
                            <section className="dashboard-card">
                                <span className="eyebrow">STOCK IN</span>
                                <h3>Record Incoming Stock</h3>
                                <p>
                                    Record a purchase from a producer. This adds
                                    to the material's overall available quantity.
                                </p>

                                {products.length === 0 || producers.length === 0 ? (
                                    <p>
                                        Add at least one active product and producer
                                        before recording a purchase.
                                    </p>
                                ) : (
                                    <form onSubmit={submitPurchase}>
                                        <div className="form-group">
                                            <label>Material</label>
                                            <SearchSelect
                                                options={productOptions}
                                                value={purchaseForm.productId}
                                                onChange={(value) =>
                                                    setPurchaseForm((previous) => ({
                                                        ...previous,
                                                        productId: value,
                                                    }))
                                                }
                                                placeholder="Search material by name..."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Producer</label>
                                            <SearchSelect
                                                options={producerOptions}
                                                value={purchaseForm.producerId}
                                                onChange={(value) =>
                                                    setPurchaseForm((previous) => ({
                                                        ...previous,
                                                        producerId: value,
                                                    }))
                                                }
                                                placeholder="Search producer by name..."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                Quantity ({getProductUnit(purchaseForm.productId) || "unit"})
                                            </label>
                                            <input
                                                name="quantity"
                                                type="number"
                                                min="0.001"
                                                step="any"
                                                value={purchaseForm.quantity}
                                                onChange={updatePurchase}
                                                placeholder="Enter quantity received"
                                                required
                                            />
                                        </div>

                                        <button type="submit" disabled={saving}>
                                            {saving ? "Saving..." : "Record Purchase"}
                                        </button>
                                    </form>
                                )}
                            </section>
                        )}

                        {activeTab === "usage" && (
                            <section className="dashboard-card">
                                <span className="eyebrow">STOCK OUT</span>
                                <h3>Record Material Usage</h3>
                                <p>
                                    Record materials used for a client's printing
                                    work. Stock is deducted from the overall total.
                                </p>

                                {products.length === 0 || clients.length === 0 ? (
                                    <p>
                                        Add at least one active product and client
                                        before recording usage.
                                    </p>
                                ) : (
                                    <form onSubmit={submitUsage}>
                                        <div className="form-group">
                                            <label>Material</label>
                                            <SearchSelect
                                                options={productOptions}
                                                value={usageForm.productId}
                                                onChange={(value) =>
                                                    setUsageForm((previous) => ({
                                                        ...previous,
                                                        productId: value,
                                                    }))
                                                }
                                                placeholder="Search material by name..."
                                            />

                                            {usageForm.productId && (
                                                <p className="inventory-hint">
                                                    Available:{" "}
                                                    {getAvailableQuantity(usageForm.productId)}{" "}
                                                    {getProductUnit(usageForm.productId)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label>Client</label>
                                            <SearchSelect
                                                options={clientOptions}
                                                value={usageForm.clientId}
                                                onChange={(value) =>
                                                    setUsageForm((previous) => ({
                                                        ...previous,
                                                        clientId: value,
                                                    }))
                                                }
                                                placeholder="Search client by name..."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                Quantity Used ({getProductUnit(usageForm.productId) || "unit"})
                                            </label>
                                            <input
                                                name="quantity"
                                                type="number"
                                                min="0.001"
                                                step="any"
                                                max={
                                                    usageForm.productId
                                                        ? getAvailableQuantity(usageForm.productId)
                                                        : undefined
                                                }
                                                value={usageForm.quantity}
                                                onChange={updateUsage}
                                                placeholder="Enter quantity used"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Purpose / Work</label>
                                            <input
                                                name="purpose"
                                                value={usageForm.purpose}
                                                onChange={updateUsage}
                                                placeholder="e.g. College printing work"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Notes</label>
                                            <textarea
                                                name="notes"
                                                value={usageForm.notes}
                                                onChange={updateUsage}
                                                placeholder="Additional details (optional)"
                                                rows="3"
                                            />
                                        </div>

                                        <button type="submit" disabled={saving}>
                                            {saving ? "Saving..." : "Record Usage"}
                                        </button>
                                    </form>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default Stock;
