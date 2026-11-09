
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./SellerDashboard.css";

const initialForm = {
    name: "",
    price: "",
    stock: "",
    desc: "",
    category: ""
};

export default function SellerDashboard() {
    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingProductId, setEditingProductId] = useState(null);
    const [editForm, setEditForm] = useState(initialForm);
    const [editImage, setEditImage] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState("");
    const [updating, setUpdating] = useState(false);

    const [deletingProductId, setDeletingProductId] = useState(null);
    const [activatingProductId, setActivatingProductId] = useState(null);
    const [salesOpen, setSalesOpen] = useState(false);
    const [sellerReviews, setSellerReviews] = useState([]);
    const [reviewSummaries, setReviewSummaries] = useState([]);
    const [store, setStore] = useState(null);

    // Separate active and inactive products.
    const activeProducts = useMemo(
        () => products.filter((product) => product.isActive !== false),
        [products]
    );

    const inactiveProducts = useMemo(
        () => products.filter((product) => product.isActive === false),
        [products]
    );

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "";
        if (imageUrl.startsWith("http")) return imageUrl;

        const serverUrl = (API.defaults.baseURL || "").replace(/\/api\/?$/, "");
        return `${serverUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    };

    // Fetch seller products and analytics.
    const fetchMyProducts = async (showLoading = true) => {
        if (showLoading) setLoading(true);

        try {
            const response = await API.get("/products/my-products");

            const data =
                response.data.products ||
                response.data.data ||
                response.data;

            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Products loading error:", err);
            setError(
                err.response?.data?.message ||
                "Could not load your products."
            );
        }

        try {
            const response = await API.get("/reviews/seller");
            setSellerReviews(response.data.reviews || []);
            setReviewSummaries(response.data.summaries || []);
        } catch (err) {
            console.error("Reviews loading error:", err);
            setSellerReviews([]);
            setReviewSummaries([]);
        }
        try {
            const response = await API.get("/products/seller-analytics");
            setAnalytics(response.data.analytics || null);
        } catch (err) {
            console.error("Analytics loading error:", err);
            setAnalytics(null);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyProducts();
        API.get("/stores/my-store")
            .then((response) => setStore(response.data.store || null))
            .catch((err) => console.error("Store loading error:", err));
    }, []);

    // Activate an inactive product.
    const handleActivateProduct = async (productId, productName) => {
        const confirmed = window.confirm(
            `Are you sure you want to activate "${productName}"?`
        );

        if (!confirmed) return;

        try {
            setActivatingProductId(productId);
            setError("");
            setSuccess("");

            await API.patch(`/products/${productId}/activate`);

            setSuccess(`"${productName}" activated successfully!`);

            // Refresh products and analytics without hiding the whole dashboard.
            await fetchMyProducts(false);
        } catch (err) {
            console.error("Activate product error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to activate product."
            );
        } finally {
            setActivatingProductId(null);
        }
    };

    // Add product form.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const validateImage = (file) => {
        if (!file) return true;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image.");
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5 MB.");
            return false;
        }

        return true;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!validateImage(file)) {
            e.target.value = "";
            return;
        }

        setError("");
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (
            !form.name.trim() ||
            !form.category.trim() ||
            !form.desc.trim() ||
            form.price === "" ||
            form.stock === ""
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (
            !Number.isFinite(Number(form.price)) ||
            Number(form.price) < 0 ||
            !Number.isInteger(Number(form.stock)) ||
            Number(form.stock) < 0
        ) {
            setError(
                "Enter a valid price and a non-negative whole-number stock."
            );
            return;
        }

        try {
            setSaving(true);

            const productData = new FormData();
            productData.append("name", form.name.trim());
            productData.append("price", Number(form.price));
            productData.append("stock", Number(form.stock));
            productData.append("desc", form.desc.trim());
            productData.append("category", form.category.trim());

            if (image) {
                productData.append("image", image);
            }

            await API.post("/products", productData);

            setSuccess("Product added successfully!");
            setForm(initialForm);
            setImage(null);
            setImagePreview("");

            const input = document.getElementById("product-image");
            if (input) input.value = "";

            await fetchMyProducts(false);
        } catch (err) {
            console.error("Product creation error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to add product."
            );
        } finally {
            setSaving(false);
        }
    };

    // Edit product.
    const handleEdit = (product) => {
        if (product.isActive === false) return;

        setEditingProductId(product._id);

        setEditForm({
            name: product.name || "",
            category: product.category || "",
            price: product.price ?? "",
            stock: product.stock ?? "",
            desc: product.desc || ""
        });

        setEditImage(null);
        setEditImagePreview(
            product.imageUrl ? getImageUrl(product.imageUrl) : ""
        );

        setError("");
        setSuccess("");

        setTimeout(() => {
            document.getElementById("edit-product-section")?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }, 100);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;

        setEditForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleEditImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!validateImage(file)) {
            e.target.value = "";
            return;
        }

        setError("");
        setEditImage(file);
        setEditImagePreview(URL.createObjectURL(file));
    };

    const handleCancelEdit = () => {
        setEditingProductId(null);
        setEditForm(initialForm);
        setEditImage(null);
        setEditImagePreview("");
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (
            !editForm.name.trim() ||
            !editForm.category.trim() ||
            !editForm.desc.trim() ||
            editForm.price === "" ||
            editForm.stock === ""
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (
            !Number.isFinite(Number(editForm.price)) ||
            Number(editForm.price) < 0 ||
            !Number.isInteger(Number(editForm.stock)) ||
            Number(editForm.stock) < 0
        ) {
            setError(
                "Enter a valid price and a non-negative whole-number stock."
            );
            return;
        }

        try {
            setUpdating(true);

            if (editImage) {
                const updatedData = new FormData();

                updatedData.append("name", editForm.name.trim());
                updatedData.append("category", editForm.category.trim());
                updatedData.append("price", Number(editForm.price));
                updatedData.append("stock", Number(editForm.stock));
                updatedData.append("desc", editForm.desc.trim());
                updatedData.append("image", editImage);

                await API.put(
                    `/products/${editingProductId}`,
                    updatedData
                );
            } else {
                await API.put(`/products/${editingProductId}`, {
                    name: editForm.name.trim(),
                    category: editForm.category.trim(),
                    price: Number(editForm.price),
                    stock: Number(editForm.stock),
                    desc: editForm.desc.trim()
                });
            }

            setSuccess("Product updated successfully!");

            handleCancelEdit();
            await fetchMyProducts(false);
        } catch (err) {
            console.error(
                "Update product error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                "Failed to update product."
            );
        } finally {
            setUpdating(false);
        }
    };

    // Deactivate product.
    const handleDeleteProduct = async (productId, productName) => {
        const confirmed = window.confirm(
            `Move "${productName}" to Inactive Products? It will no longer be available for customers.`
        );

        if (!confirmed) return;

        try {
            setDeletingProductId(productId);
            setError("");
            setSuccess("");

            await API.delete(`/products/${productId}`);

            if (editingProductId === productId) {
                handleCancelEdit();
            }

            setSuccess(
                `"${productName}" was moved to Inactive Products.`
            );

            await fetchMyProducts(false);
        } catch (err) {
            console.error("Delete product error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to deactivate product."
            );
        } finally {
            setDeletingProductId(null);
        }
    };

    const formatMoney = (amount) =>
        `₹${Number(amount || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 2
        })}`;

    
const renderSalesGroup = (title, subtitle, records = []) => (
    <div className="sales-analysis-card" key={title}>
        <h3>{title}</h3>
        <p>{subtitle}</p>

        {records.length === 0 ? (
            <div className="seller-empty compact">
                <p>No completed sales recorded.</p>
            </div>
        ) : (
            <div className="sales-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Orders</th>
                            <th>Units Sold</th>
                            <th>Sales Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {records.map((item) => (
                            <tr key={item.label}>
                                <td>{item.label}</td>
                                <td>{item.orders}</td>
                                <td>{item.units}</td>
                                <td>{formatMoney(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);


    return (
        <div className="seller-dashboard">

            {/* Header */}
            <header className="seller-header">
                <div>
                    <span className="seller-eyebrow">
                        SHOPZONE SELLER PANEL
                    </span>

                    <h1>{store?.storeName || "Seller Dashboard"}</h1>

                    <p>
                        Manage your store and its products in one place.
                    </p>
                </div>

                <button
                    type="button"
                    className="seller-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </header>

            {error && (
                <div className="seller-message error">
                    {error}
                </div>
            )}

            {success && (
                <div className="seller-message success">
                    {success}
                </div>
            )}

            {/* Active inventory statistics */}
            <div className="seller-stats">
                <div className="seller-stat-card">
                    <span>Active Products</span>
                    <h2>
                        {analytics?.totalProducts ?? activeProducts.length}
                    </h2>
                </div>

                <div className="seller-stat-card">
                    <span>Units Sold</span>
                    <h2>{analytics?.totalUnitsOrdered ?? 0}</h2>
                </div>

                <div className="seller-stat-card">
                    <span>Available Stock</span>
                    <h2>
                        {analytics?.totalAvailableStock ??
                            activeProducts.reduce(
                                (sum, p) => sum + Number(p.stock || 0),
                                0
                            )}
                    </h2>
                </div>

                <div className="seller-stat-card">
                    <span>Low Stock Products</span>
                    <h2 className="seller-warning-number">
                        {analytics?.lowStockCount ??
                            activeProducts.filter(
                                (p) => Number(p.stock) < 3
                            ).length}
                    </h2>
                </div>
            </div>

            {/* Low stock alert */}
            {analytics?.lowStockProducts?.length > 0 && (
                <section className="seller-alert-section">
                    <div className="seller-alert-heading">
                        <span>⚠️</span>

                        <div>
                            <h2>Low Stock Alert</h2>
                            <p>
                                Active products with fewer than 3 units remaining.
                            </p>
                        </div>
                    </div>

                    <div className="seller-alert-list">
                        {analytics.lowStockProducts.map((product) => (
                            <div
                                className="seller-alert-item"
                                key={product._id}
                            >
                                <div>
                                    <strong>{product.name}</strong>
                                    <small>{product.category}</small>
                                </div>

                                <span
                                    className={
                                        product.stock === 0
                                            ? "stock-danger"
                                            : "stock-warning"
                                    }
                                >
                                    {product.stock === 0
                                        ? "Out of Stock"
                                        : `${product.stock} left`}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Active inventory analysis */}
            <section className="seller-section">
                <div className="seller-section-heading">
                    <div>
                        <h2>Active Inventory Analysis</h2>
                        <p>
                            Inactive products are excluded from this table
                            and all active stock statistics.
                        </p>
                    </div>
                </div>

                {!analytics?.productAnalysis?.length ? (
                    <p className="seller-empty">
                        No active product analytics available yet.
                    </p>
                ) : (
                    <div className="seller-analysis-table-wrapper">
                        <table className="seller-analysis-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Units Sold</th>
                                    <th>Available Stock</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {analytics.productAnalysis.map((product) => (
                                    <tr key={product._id}>
                                        <td>
                                            <strong>{product.name}</strong>
                                        </td>

                                        <td>{product.unitsOrdered}</td>
                                        <td>{product.stock}</td>

                                        <td>
                                            <span
                                                className={
                                                    product.stock < 3
                                                        ? "analysis-low"
                                                        : "analysis-good"
                                                }
                                            >
                                                {product.stock === 0
                                                    ? "Out of Stock"
                                                    : product.stock < 3
                                                        ? "Low Stock"
                                                        : "Healthy"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Collapsible sales reports */}
            
{/* Collapsible sales reports */}
<section className="seller-section sales-performance-section">

    <button
        type="button"
        className="sales-dropdown-toggle"
        onClick={() => setSalesOpen((open) => !open)}
        aria-expanded={salesOpen}
    >
        <span>
            <strong>Sales Performance</strong>

            <small>
                Delivered orders only · Daily, monthly and yearly reports
            </small>
        </span>

        <span
            className={`sales-chevron ${salesOpen ? "open" : ""}`}
        >
            ⌄
        </span>
    </button>

    {salesOpen && (
        !analytics ? (
            <p className="seller-empty">
                Sales analytics are currently unavailable.
                Please refresh the dashboard.
            </p>
        ) : (
            <>
                {(() => {
                    const daily = analytics.sales?.daily || [];
                    const monthly = analytics.sales?.monthly || [];
                    const yearly = analytics.sales?.yearly || [];

                    const hasSales =
                        daily.length > 0 ||
                        monthly.length > 0 ||
                        yearly.length > 0;

                    if (!hasSales) {
                        return (
                            <div className="seller-empty">
                                <h3>No Completed Sales Yet</h3>
                                <p>
                                    Your sales reports will appear here
                                    when one of your orders is delivered.
                                </p>
                            </div>
                        );
                    }

                    return (
                        <div className="sales-analysis-grid">

                            {renderSalesGroup(
                                "Daily Sales",
                                "Only days with completed sales",
                                daily
                            )}

                            {renderSalesGroup(
                                "Monthly Sales",
                                "Only months with completed sales",
                                monthly
                            )}

                            {renderSalesGroup(
                                "Yearly Sales",
                                "Only years with completed sales",
                                yearly
                            )}

                        </div>
                    );
                })()}
            </>
        )
    )}

</section>


            {/* Add new product */}
            <section className="seller-section">
                <div className="seller-section-heading">
                    <div>
                        <h2>Add New Product</h2>
                        <p>
                            {store?.storeName
                                ? `Add a product to ${store.storeName}.`
                                : "Enter the details of the product you want to sell."}
                        </p>
                    </div>
                </div>

                <form
                    className="seller-product-form"
                    onSubmit={handleSubmit}
                >
                    <div className="seller-form-grid">
                        <div className="seller-field">
                            <label>Product Name *</label>

                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        <div className="seller-field">
                            <label>Category *</label>

                            <input
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                placeholder="Example: Electronics"
                                required
                            />
                        </div>

                        <div className="seller-field">
                            <label>Price (₹) *</label>

                            <input
                                type="number"
                                name="price"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="seller-field">
                            <label>Available Stock *</label>

                            <input
                                type="number"
                                name="stock"
                                min="0"
                                step="1"
                                value={form.stock}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="seller-field full-width">
                            <label>Upload Product Image</label>

                            <input
                                id="product-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                            />

                            <small>Maximum image size: 5 MB.</small>
                        </div>

                        {imagePreview && (
                            <div className="seller-field full-width">
                                <label>Image Preview</label>

                                <div className="seller-upload-preview">
                                    <img
                                        src={imagePreview}
                                        alt="Product preview"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImage(null);
                                            setImagePreview("");

                                            const input =
                                                document.getElementById(
                                                    "product-image"
                                                );

                                            if (input) input.value = "";
                                        }}
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="seller-field full-width">
                            <label>Description *</label>

                            <textarea
                                name="desc"
                                rows="5"
                                value={form.desc}
                                onChange={handleChange}
                                placeholder="Describe your product..."
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="seller-submit-btn"
                        disabled={saving}
                    >
                        {saving ? "Adding Product..." : "+ Add Product"}
                    </button>
                </form>
            </section>

            {/* Edit product */}
            {editingProductId && (
                <section
                    className="seller-section seller-edit-section"
                    id="edit-product-section"
                >
                    <div className="seller-section-heading">
                        <div>
                            <h2>Edit Existing Product</h2>
                            <p>
                                Change the product details, stock or image.
                            </p>
                        </div>
                    </div>

                    <form
                        className="seller-product-form"
                        onSubmit={handleUpdateProduct}
                    >
                        <div className="seller-form-grid">
                            <div className="seller-field">
                                <label>Product Name *</label>

                                <input
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>

                            <div className="seller-field">
                                <label>Category *</label>

                                <input
                                    name="category"
                                    value={editForm.category}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>

                            <div className="seller-field">
                                <label>Price (₹) *</label>

                                <input
                                    type="number"
                                    name="price"
                                    min="0"
                                    step="0.01"
                                    value={editForm.price}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>

                            <div className="seller-field">
                                <label>Available Stock *</label>

                                <input
                                    type="number"
                                    name="stock"
                                    min="0"
                                    step="1"
                                    value={editForm.stock}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>

                            <div className="seller-field full-width">
                                <label>Replace Product Image</label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditImageChange}
                                />

                                <small>
                                    Leave empty to keep the existing image.
                                    Maximum size: 5 MB.
                                </small>
                            </div>

                            {editImagePreview && (
                                <div className="seller-field full-width">
                                    <label>Product Image Preview</label>

                                    <div className="seller-upload-preview">
                                        <img
                                            src={editImagePreview}
                                            alt="Product preview"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="seller-field full-width">
                                <label>Description *</label>

                                <textarea
                                    name="desc"
                                    rows="5"
                                    value={editForm.desc}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="seller-edit-actions">
                            <button
                                type="submit"
                                className="seller-submit-btn"
                                disabled={updating}
                            >
                                {updating
                                    ? "Saving Changes..."
                                    : "Save Product Changes"}
                            </button>

                            <button
                                type="button"
                                className="seller-cancel-btn"
                                onClick={handleCancelEdit}
                                disabled={updating}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Customer reviews */}
            <section className="seller-section">
                <div className="seller-section-heading">
                    <div>
                        <h2>Customer Reviews ({sellerReviews.length})</h2>
                        <p>Ratings and feedback customers left for your products.</p>
                    </div>
                </div>

                {reviewSummaries.length > 0 && (
                    <div className="seller-review-summaries">
                        {reviewSummaries.map((summary) => {
                            const product = products.find(
                                (item) => String(item._id) === summary.productId
                            );

                            return (
                                <div className="seller-review-summary" key={summary.productId}>
                                    <strong>{product?.name || "Product"}</strong>
                                    <span>
                                        <span className="seller-review-stars" aria-hidden="true">★★★★★</span>{" "}
                                        {summary.averageRating.toFixed(1)} · {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {sellerReviews.length === 0 ? (
                    <p className="seller-empty">You have no customer reviews yet.</p>
                ) : (
                    <div className="seller-reviews-list">
                        {sellerReviews.map((review) => (
                            <article className="seller-review-card" key={review._id}>
                                <div className="seller-review-top">
                                    <div>
                                        <strong>{review.product?.name || "Product"}</strong>
                                        <span>by {review.user?.name || "Customer"}</span>
                                    </div>
                                    <time dateTime={review.createdAt}>
                                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })}
                                    </time>
                                </div>
                                <div className="seller-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                                </div>
                                <p>{review.comment}</p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
            {/* Active products */}
            <section className="seller-section">
                <div className="seller-section-heading">
                    <div>
                        <h2>
                            Active Products ({activeProducts.length})
                        </h2>

                        <p>
                            Products currently available in your store.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p className="seller-empty">Loading products...</p>
                ) : activeProducts.length === 0 ? (
                    <p className="seller-empty">
                        You have no active products.
                    </p>
                ) : (
                    <div className="seller-products-grid">
                        {activeProducts.map((product) => (
                            <article
                                className="seller-product-card"
                                key={product._id}
                            >
                                <div className="seller-product-image">
                                    {product.imageUrl ? (
                                        <img
                                            src={getImageUrl(product.imageUrl)}
                                            alt={product.name}
                                        />
                                    ) : (
                                        <span>No image</span>
                                    )}
                                </div>

                                <div className="seller-product-info">
                                    <span className="seller-category">
                                        {product.category}
                                    </span>

                                    <h3>{product.name}</h3>

                                    <p className="seller-product-price">
                                        {formatMoney(product.price)}
                                    </p>

                                    <p className="seller-product-stock">
                                        Stock: {product.stock}
                                    </p>

                                    <span className="seller-status active">
                                        Active
                                    </span>

                                    <button
                                        type="button"
                                        className="seller-edit-btn"
                                        onClick={() => handleEdit(product)}
                                    >
                                        ✏️ Edit Product
                                    </button>

                                    <button
                                        type="button"
                                        className="seller-delete-btn"
                                        onClick={() =>
                                            handleDeleteProduct(
                                                product._id,
                                                product.name
                                            )
                                        }
                                        disabled={
                                            deletingProductId === product._id
                                        }
                                    >
                                        {deletingProductId === product._id
                                            ? "Deactivating..."
                                            : "Delete Product"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Inactive products with Make Active button */}
            <section className="seller-section inactive-products-section">
                <div className="seller-section-heading">
                    <div>
                        <h2>
                            Inactive Products ({inactiveProducts.length})
                        </h2>

                        <p>
                            These products are hidden from customers and
                            excluded from active inventory statistics.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p className="seller-empty">Loading products...</p>
                ) : inactiveProducts.length === 0 ? (
                    <p className="seller-empty">
                        No inactive products.
                    </p>
                ) : (
                    <div className="seller-products-grid">
                        {inactiveProducts.map((product) => (
                            <article
                                className="seller-product-card inactive-product-card"
                                key={product._id}
                            >
                                <div className="seller-product-image">
                                    {product.imageUrl ? (
                                        <img
                                            src={getImageUrl(product.imageUrl)}
                                            alt={product.name}
                                        />
                                    ) : (
                                        <span>No image</span>
                                    )}
                                </div>

                                <div className="seller-product-info">
                                    <span className="seller-category">
                                        {product.category}
                                    </span>

                                    <h3>{product.name}</h3>

                                    <p className="seller-product-price">
                                        {formatMoney(product.price)}
                                    </p>

                                    <p className="seller-product-stock">
                                        Last recorded stock: {product.stock}
                                    </p>

                                    <span className="seller-status inactive">
                                        Inactive
                                    </span>

                                    {/* Activation button */}
                                    <button
                                        type="button"
                                        className="seller-edit-btn"
                                        onClick={() =>
                                            handleActivateProduct(
                                                product._id,
                                                product.name
                                            )
                                        }
                                        disabled={
                                            activatingProductId === product._id
                                        }
                                    >
                                        {activatingProductId === product._id
                                            ? "Activating..."
                                            : "✓ Make Active"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
