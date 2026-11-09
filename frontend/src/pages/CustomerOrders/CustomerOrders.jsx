
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./CustomerOrders.css";

export default function CustomerOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reviewedProductIds, setReviewedProductIds] = useState(() => new Set());
    const [reviewDetailsByKey, setReviewDetailsByKey] = useState({});
    const [reviewDrafts, setReviewDrafts] = useState({});
    const [activeReviewProductId, setActiveReviewProductId] = useState(null);
    const [submittingReviewId, setSubmittingReviewId] = useState(null);
    const [reviewMessages, setReviewMessages] = useState({});

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const [response, reviewsResponse] = await Promise.all([
                API.get("/customer/orders"),
                API.get("/reviews/my-reviews")
            ]);

            const data = response.data.orders || response.data;
            const customerReviews = reviewsResponse.data.reviews || [];
            setOrders(Array.isArray(data) ? data : []);
            setReviewedProductIds(
                new Set(
                    customerReviews.map((review) =>
                        `${String(review.order?._id || review.order)}:${String(review.product?._id || review.product)}`
                    )
                )
            );
            setReviewDetailsByKey(
                Object.fromEntries(
                    customerReviews.map((review) => [
                        `${String(review.order?._id || review.order)}:${String(review.product?._id || review.product)}`,
                        review
                    ])
                )
            );

        } catch (err) {
            console.log("Orders error:", err.response?.data || err);

            setError(
                err.response?.data?.message ||
                "Unable to load your orders"
            );
        } finally {
            setLoading(false);
        }
    };

    const updateReviewDraft = (reviewKey, updates) => {
        setReviewDrafts((current) => ({
            ...current,
            [reviewKey]: {
                rating: 5,
                comment: "",
                ...current[reviewKey],
                ...updates
            }
        }));
    };

    const handleSubmitReview = async (event, orderId, productId, reviewKey) => {
        event.preventDefault();
        const draft = reviewDrafts[reviewKey] || { rating: 5, comment: "" };
        const comment = draft.comment.trim();

        if (comment.length < 3) {
            setReviewMessages((current) => ({
                ...current,
                [reviewKey]: "Please write at least 3 characters."
            }));
            return;
        }

        try {
            setSubmittingReviewId(reviewKey);
            setReviewMessages((current) => ({ ...current, [reviewKey]: "" }));
            const response = await API.post("/reviews", {
                orderId,
                productId,
                rating: draft.rating,
                comment
            });

            setReviewDetailsByKey((current) => ({
                ...current,
                [reviewKey]: response.data.review
            }));
            setReviewedProductIds((current) => new Set([...current, reviewKey]));
            window.dispatchEvent(new Event("reviewsUpdated"));
            setActiveReviewProductId(null);
            setReviewMessages((current) => ({
                ...current,
                [reviewKey]: response.data.message || "Review submitted successfully."
            }));
        } catch (err) {
            setReviewMessages((current) => ({
                ...current,
                [reviewKey]: err.response?.data?.message || "Unable to submit your review."
            }));
        } finally {
            setSubmittingReviewId(null);
        }
    };

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const formatPrice = (price) => {
        return Number(price || 0).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR"
        });
    };

    const getStatusClass = (status) => {
        return (status || "pending").toLowerCase();
    };

    if (loading) {
        return (
            <div className="orders-message">
                Loading your orders...
            </div>
        );
    }

    return (
        <div className="customer-orders-page">
            <div className="orders-container">

                <button
                    className="orders-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>

                <div className="orders-heading">
                    <p className="orders-label">MY ACCOUNT</p>
                    <h1>My Orders</h1>
                    <p>Track and manage your purchases.</p>
                </div>

                {error && (
                    <div className="orders-error">
                        {error}
                        <button onClick={fetchOrders}>
                            Try Again
                        </button>
                    </div>
                )}

                {!error && orders.length === 0 && (
                    <div className="empty-orders">
                        <div className="empty-orders-icon">📦</div>
                        <h2>No orders yet</h2>
                        <p>
                            You haven't purchased anything yet.
                            Your orders will appear here.
                        </p>

                        <button onClick={() => navigate("/")}>
                            Start Shopping
                        </button>
                    </div>
                )}

                {!error && orders.length > 0 && (
                    <div className="orders-list">

                        {orders.map((order) => (
                            <div className="order-card" key={order._id}>

                                <div className="order-card-header">
                                    <div>
                                        <span>ORDER ID</span>
                                        <h3>
                                            #{order._id.slice(-8).toUpperCase()}
                                        </h3>
                                    </div>

                                    <div className="order-date">
                                        <span>ORDER DATE</span>
                                        <p>{formatDate(order.createdAt)}</p>
                                    </div>

                                    <span
                                        className={`order-status ${getStatusClass(order.status)}`}
                                    >
                                        {order.status || "Pending"}
                                    </span>
                                </div>

                                <div className="order-items">
                                    {(order.items || []).map((item, index) => {
                                        const productId = String(item.product?._id || item.product || "");
                                        const orderId = String(order._id);
                                        const reviewKey = `${orderId}:${productId}`;
                                        const submittedReview = reviewDetailsByKey[reviewKey];
                                        const draft = reviewDrafts[reviewKey] || { rating: 5, comment: "" };
                                        const canReview = order.status?.toLowerCase() === "delivered" && productId;

                                        return (
                                        <div className="order-item" key={item._id || index}>
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                />
                                            ) : (
                                                <div className="order-item-placeholder">
                                                    📦
                                                </div>
                                            )}

                                            <div className="order-item-info">
                                                <h4>{item.name}</h4>
                                                <p>
                                                    Quantity: {item.quantity}
                                                </p>
                                                <p>
                                                    Price: {formatPrice(item.price)}
                                                </p>

                                                {canReview && reviewedProductIds.has(reviewKey) ? (
                                                    <div className="customer-review-posted">
                                                        <strong className="customer-review-complete">✓ Your review</strong>
                                                        <div className="customer-review-posted-stars" aria-label={`${submittedReview?.rating || 0} out of 5 stars`}>
                                                            {"★".repeat(Number(submittedReview?.rating) || 0)}{"☆".repeat(5 - (Number(submittedReview?.rating) || 0))}
                                                        </div>
                                                        <p>{submittedReview?.comment || "Your review was submitted."}</p>
                                                    </div>
                                                ) : canReview && activeReviewProductId === reviewKey ? (
                                                    <form className="customer-order-review-form" onSubmit={(event) => handleSubmitReview(event, orderId, productId, reviewKey)}>
                                                        <label>Your rating</label>
                                                        <div className="customer-order-review-stars">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    className={star <= draft.rating ? "selected" : ""}
                                                                    onClick={() => updateReviewDraft(reviewKey, { rating: star })}
                                                                    aria-label={`Rate ${star} out of 5`}
                                                                >★</button>
                                                            ))}
                                                        </div>
                                                        <label htmlFor={`customer-review-${reviewKey}`}>Your review</label>
                                                        <textarea
                                                            id={`customer-review-${reviewKey}`}
                                                            value={draft.comment}
                                                            onChange={(event) => updateReviewDraft(reviewKey, { comment: event.target.value })}
                                                            placeholder="Share your experience with this product..."
                                                            rows="3"
                                                            maxLength="1000"
                                                            required
                                                        />
                                                        {reviewMessages[reviewKey] && <p className="customer-review-message">{reviewMessages[reviewKey]}</p>}
                                                        <div className="customer-order-review-actions">
                                                            <button type="submit" disabled={submittingReviewId === reviewKey}>
                                                                {submittingReviewId === reviewKey ? "Submitting..." : "Submit review"}
                                                            </button>
                                                            <button type="button" className="review-cancel" onClick={() => setActiveReviewProductId(null)} disabled={submittingReviewId === reviewKey}>Cancel</button>
                                                        </div>
                                                    </form>
                                                ) : canReview ? (
                                                    <div className="customer-review-entry">
                                                        <button type="button" onClick={() => setActiveReviewProductId(reviewKey)}>Rate this product</button>
                                                        {reviewMessages[reviewKey] && <p className="customer-review-message">{reviewMessages[reviewKey]}</p>}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <strong>
                                                {formatPrice(
                                                    item.price * item.quantity
                                                )}
                                            </strong>
                                        </div>
                                        );
                                    })}
                                </div>

                                <div className="order-card-footer">

                                    <div className="order-payment">
                                        <span>PAYMENT STATUS</span>
                                        <p className={`payment-status ${getStatusClass(order.paymentStatus)}`}>
                                            {order.paymentStatus || "Pending"}
                                        </p>
                                    </div>

                                    <div className="order-total">
                                        <span>TOTAL AMOUNT</span>
                                        <h3>
                                            {formatPrice(order.totalAmount)}
                                        </h3>
                                    </div>

                                </div>

                                {order.shippingAddress && (
                                    <div className="order-shipping">
                                        <h4>Delivery Address</h4>

                                        <p>
                                            {order.shippingAddress.fullName}
                                        </p>

                                        <p>
                                            {order.shippingAddress.address}
                                        </p>

                                        <p>
                                            {order.shippingAddress.city}
                                            {order.shippingAddress.postalCode
                                                ? ` - ${order.shippingAddress.postalCode}`
                                                : ""}
                                        </p>

                                        <p>
                                            Phone: {order.shippingAddress.phone}
                                        </p>
                                    </div>
                                )}

                            </div>
                        ))}

                    </div>
                )}

            </div>
        </div>
    );
}
