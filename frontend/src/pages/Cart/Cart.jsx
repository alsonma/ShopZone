
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import "./Cart.css";

export default function Cart() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Convert backend image path into a complete URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "";

        if (imageUrl.startsWith("http")) {
            return imageUrl;
        }

        const baseURL =
            API.defaults.baseURL?.replace(/\/api\/?$/, "") || "";

        return `${baseURL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    };

    // GET CART
    const fetchCart = async () => {
        const token = localStorage.getItem("token");

        // Check login before calling the backend
        if (!token) {
            setIsLoggedIn(false);
            setItems([]);
            setLoading(false);
            return;
        }

        setIsLoggedIn(true);

        try {
            setLoading(true);
            setError("");

            const response = await API.get("/cart");

            setItems(response.data.cart?.items || []);

        } catch (err) {
            console.error("Fetch cart error:", err);

            if (err.response?.status === 401 ||
                err.response?.status === 403) {
                setIsLoggedIn(false);
                setItems([]);
            } else {
                setError("Unable to load your cart. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // UPDATE QUANTITY
    const updateQuantity = async (productId, quantity) => {
        if (quantity < 1) return;

        try {
            setUpdating(productId);
            setError("");

            const response = await API.put(
                `/cart/update/${productId}`,
                { quantity }
            );

            setItems(response.data.cart?.items || []);

        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to update quantity"
            );
        } finally {
            setUpdating("");
        }
    };

    // REMOVE PRODUCT
    const removeItem = async (productId) => {
        try {
            setUpdating(productId);
            setError("");

            const response = await API.delete(
                `/cart/remove/${productId}`
            );

            setItems(response.data.cart?.items || []);

        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to remove product"
            );
        } finally {
            setUpdating("");
        }
    };

    // CALCULATE TOTAL
    const subtotal = items.reduce((total, item) => {
        return total + (Number(item.product?.price) || 0) * item.quantity;
    }, 0);

    if (loading) {
        return (
            <div className="cart-message">
                Loading your cart...
            </div>
        );
    }

    // LOGIN REQUIRED SCREEN
    if (!isLoggedIn) {
        return (
            <div className="shop-cart-page">
                <div className="empty-cart">
                    <h2>Please Login First</h2>

                    <p>
                        You need to log in to your account to view your
                        shopping cart.
                    </p>

                    <button onClick={() => navigate("/login")}>
                        Login Now
                    </button> <br />
                    <br />

                    <Link to="/" className="continue-shopping">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="shop-cart-page">

            <div className="cart-heading">
                <div>
                    <p className="cart-eyebrow">YOUR SHOPPING BAG</p>
                    <h1>Shopping Cart</h1>
                    <p>{items.length} different product(s) in your cart</p>
                </div>

                <Link to="/" className="continue-shopping">
                    ← Continue Shopping
                </Link>
            </div>

            {error && (
                <p className="cart-error">{error}</p>
            )}

            {items.length === 0 ? (
                <div className="empty-cart">
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added anything yet.</p>

                    <button onClick={() => navigate("/")}>
                        Start Shopping
                    </button>
                </div>
            ) : (

                <div className="cart-layout">

                    {/* CART PRODUCTS */}
                    <div className="cart-products">

                        {items.map((item) => {
                            const product = item.product;

                            if (!product) return null;

                            return (
                                <div
                                    className="cart-product"
                                    key={product._id}
                                >

                                    <div className="cart-product-image">
                                        {product.imageUrl ? (
                                            <img
                                                src={getImageUrl(product.imageUrl)}
                                                alt={product.name}
                                            />
                                        ) : (
                                            <span>No Image</span>
                                        )}
                                    </div>

                                    <div className="cart-product-info">
                                        <h3>{product.name}</h3>

                                        <p className="cart-category">
                                            {product.category}
                                        </p>

                                        <h4>
                                            ₹{Number(product.price).toLocaleString("en-IN")}
                                        </h4>

                                        <div className="cart-actions">

                                            <div className="quantity-control">
                                                <button
                                                    disabled={
                                                        updating === product._id ||
                                                        item.quantity <= 1
                                                    }
                                                    onClick={() =>
                                                        updateQuantity(
                                                            product._id,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                >
                                                    −
                                                </button>

                                                <span>{item.quantity}</span>

                                                <button
                                                    disabled={
                                                        updating === product._id ||
                                                        item.quantity >= product.stock
                                                    }
                                                    onClick={() =>
                                                        updateQuantity(
                                                            product._id,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                className="remove-item"
                                                disabled={updating === product._id}
                                                onClick={() => removeItem(product._id)}
                                            >
                                                Remove
                                            </button>

                                        </div>
                                    </div>

                                    <div className="cart-item-total">
                                        ₹{(
                                            product.price * item.quantity
                                        ).toLocaleString("en-IN")}
                                    </div>

                                </div>
                            );
                        })}

                    </div>

                    {/* ORDER SUMMARY */}
                    <div className="cart-summary">
                        <h3>Order Summary</h3>

                        {items.map((item) => (
                            item.product && (
                                <div
                                    className="cart-summary-row"
                                    key={item.product._id}
                                >
                                    <span>
                                        {item.product.name} × {item.quantity}
                                    </span>

                                    <span>
                                        ₹{(
                                            item.product.price * item.quantity
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            )
                        ))}

                        <div className="cart-summary-row cart-total">
                            <strong>Total</strong>
                            <strong>₹{subtotal.toFixed(2)}</strong>
                        </div>

                        <button
                            className="checkout-btn"
                            onClick={() => navigate("/checkout")}
                            disabled={items.length === 0}
                        >
                            Proceed to Checkout
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
}
