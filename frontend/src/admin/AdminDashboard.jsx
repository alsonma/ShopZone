import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Admin.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ storeName: "", description: "", phone: "", status: "active" });
    const [saving, setSaving] = useState(false);

    const loadOverview = async () => {
        try {
            setError("");
            const response = await API.get("/admin/overview");
            setOverview(response.data.overview);
        } catch (err) {
            setError(err.response?.data?.message || "Could not load admin data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOverview(); }, []);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin/login");
    };

    const startEdit = (store) => {
        setEditingId(store._id);
        setEditForm({
            storeName: store.storeName || "",
            description: store.description || "",
            phone: store.phone || "",
            status: store.status || "active"
        });
    };

    const saveStore = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            await API.put(`/admin/stores/${editingId}`, editForm);
            setEditingId(null);
            await loadOverview();
        } catch (err) {
            setError(err.response?.data?.message || "Could not update this store.");
        } finally {
            setSaving(false);
        }
    };

    const deleteStore = async (store) => {
        if (!window.confirm(`Delete ${store.storeName} and all ${store.productCount} of its products? This cannot be undone.`)) return;
        try {
            await API.delete(`/admin/stores/${store._id}`);
            await loadOverview();
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete this store.");
        }
    };

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <h2>Shop<span>Zone</span>.</h2>
                <p className="sidebar-label">MANAGEMENT</p>
                <button className="active" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Overview</button>
                <button onClick={() => navigate("/")}>View Store</button>
                <button onClick={logout}>Logout</button>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div><p>ADMIN PANEL</p><h1>Stores &amp; sales overview</h1></div>
                    <span>Welcome, {user.name || "Admin"}</span>
                </header>

                {error && <div className="admin-message error">{error}</div>}
                {loading ? <p className="admin-loading">Loading stores and products…</p> : <>
                    <section className="admin-stats">
                        <div className="stat-card"><p>Total Sales</p><h2>{money(overview?.totalSales)}</h2><small>From orders excluding cancelled, failed, or refunded orders</small></div>
                        <div className="stat-card"><p>Total Orders</p><h2>{overview?.totalOrders || 0}</h2><small>Orders included in sales</small></div>
                        <div className="stat-card"><p>Total Products</p><h2>{overview?.totalProducts || 0}</h2><small>Across all stores</small></div>
                        <div className="stat-card"><p>Total Stores</p><h2>{overview?.totalStores || 0}</h2><small>Active and suspended stores</small></div>
                    </section>

                    <section className="admin-section">
                        <div className="admin-section-heading"><div><h2>All Stores</h2><p>Review store details, inventory, and sales.</p></div></div>
                        {overview?.stores?.length ? overview.stores.map((store) => (
                            <article className="admin-store-card" key={store._id}>
                                {editingId === store._id ? (
                                    <form className="admin-edit-form" onSubmit={saveStore}>
                                        <label>Store name<input value={editForm.storeName} onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })} required /></label>
                                        <label>Description<textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></label>
                                        <label>Phone<input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></label>
                                        <label>Status<select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
                                        <div className="admin-store-actions"><button className="admin-primary-button" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button><button type="button" onClick={() => setEditingId(null)}>Cancel</button></div>
                                    </form>
                                ) : <>
                                    <div className="admin-store-heading">
                                        <div><span className={`admin-status ${store.status}`}>{store.status}</span><h3>{store.storeName}</h3><p>Owner: {store.owner?.name || "Unknown"} · {store.owner?.email || ""}</p></div>
                                        <div className="admin-store-actions"><button onClick={() => startEdit(store)}>Edit store</button><button className="admin-danger-button" onClick={() => deleteStore(store)}>Delete store</button></div>
                                    </div>
                                    <div className="admin-store-metrics"><span><strong>{store.productCount}</strong> products</span><span><strong>{store.orderCount}</strong> orders</span><span><strong>{money(store.sales)}</strong> sales</span></div>
                                    {store.description && <p className="admin-store-description">{store.description}</p>}
                                    <div className="admin-product-list">
                                        <h4>Products ({store.products?.length || 0})</h4>
                                        {store.products?.length ? <div className="admin-table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>
                                            {store.products.map((product) => <tr key={product._id}><td>{product.name}</td><td>{product.category}</td><td>{money(product.price)}</td><td>{product.stock}</td><td>{product.isActive ? "Active" : "Inactive"}</td></tr>)}
                                        </tbody></table></div> : <p className="admin-empty">No products in this store.</p>}
                                    </div>
                                </>}
                            </article>
                        )) : <p className="admin-empty">No stores found.</p>}
                    </section>

                    <section className="admin-section">
                        <div className="admin-section-heading"><div><h2>All Products</h2><p>{overview?.products?.length || 0} products across the marketplace.</p></div></div>
                        <div className="admin-table-wrap"><table><thead><tr><th>Product</th><th>Store</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>
                            {(overview?.products || []).map((product) => <tr key={product._id}><td>{product.name}</td><td>{product.store?.storeName || overview.stores.find((store) => String(store.owner?._id) === String(product.createdBy?._id))?.storeName || "Unassigned"}</td><td>{product.category}</td><td>{money(product.price)}</td><td>{product.stock}</td><td>{product.isActive ? "Active" : "Inactive"}</td></tr>)}
                        </tbody></table></div>
                    </section>
                </>}
            </main>
        </div>
    );
}
