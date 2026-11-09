import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./MyOrders.css";

// Get backend URL from Axios configuration
const SERVER_URL = API.defaults.baseURL.replace(/\/api\/?$/, "");

// Convert image paths into complete URLs
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("blob:")
  ) {
    return imageUrl;
  }

  return `${SERVER_URL}/${imageUrl.replace(/^\/+/, "")}`;
};

export default function MyOrders() {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const [reviewDetailsByKey, setReviewDetailsByKey] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [activeReviewProductId, setActiveReviewProductId] = useState(null);
  const [submittingReviewId, setSubmittingReviewId] = useState(null);
  const [reviewMessages, setReviewMessages] = useState({});

  const successMessage = location.state?.successMessage;

  // Fetch customer orders and reviews
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [ordersResponse, reviewsResponse] = await Promise.all([
          API.get("/customer/orders"),
          API.get("/reviews/my-reviews"),
        ]);

        setOrders(ordersResponse.data.orders || []);

        const customerReviews = reviewsResponse.data.reviews || [];

        setReviewedProductIds(
          new Set(
            customerReviews.map((review) =>
              `${String(review.order?._id || review.order)}:${String(
                review.product?._id || review.product
              )}`
            )
          )
        );

        setReviewDetailsByKey(
          Object.fromEntries(
            customerReviews.map((review) => [
              `${String(review.order?._id || review.order)}:${String(
                review.product?._id || review.product
              )}`,
              review,
            ])
          )
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to fetch orders."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Update review form values
  const updateReviewDraft = (reviewKey, updates) => {
    setReviewDrafts((current) => ({
      ...current,
      [reviewKey]: {
        rating: 5,
        comment: "",
        ...current[reviewKey],
        ...updates,
      },
    }));
  };

  // Submit product review
  const handleSubmitReview = async (
    event,
    orderId,
    productId,
    reviewKey
  ) => {
    event.preventDefault();

    const draft = reviewDrafts[reviewKey] || {
      rating: 5,
      comment: "",
    };

    const comment = draft.comment.trim();

    if (comment.length < 3) {
      setReviewMessages((current) => ({
        ...current,
        [reviewKey]: "Please write at least 3 characters.",
      }));
      return;
    }

    try {
      setSubmittingReviewId(reviewKey);

      setReviewMessages((current) => ({
        ...current,
        [reviewKey]: "",
      }));

      const response = await API.post("/reviews", {
        orderId,
        productId,
        rating: draft.rating,
        comment,
      });

      setReviewDetailsByKey((current) => ({
        ...current,
        [reviewKey]: response.data.review,
      }));

      setReviewedProductIds(
        (current) => new Set([...current, reviewKey])
      );

      window.dispatchEvent(new Event("reviewsUpdated"));

      setActiveReviewProductId(null);

      setReviewMessages((current) => ({
        ...current,
        [reviewKey]:
          response.data.message || "Review submitted successfully.",
      }));
    } catch (err) {
      setReviewMessages((current) => ({
        ...current,
        [reviewKey]:
          err.response?.data?.message ||
          "Unable to submit your review.",
      }));
    } finally {
      setSubmittingReviewId(null);
    }
  };

  // Format order date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get order status class
  const getStatusClass = (status) => {
    return status?.toLowerCase() || "pending";
  };

  if (loading) {
    return (
      <div className="orders-loading">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="orders-header">
        <button onClick={() => navigate("/")}>
          ← Continue Shopping
        </button>

        <h1>My Orders</h1>
        <p>Track and manage your purchases.</p>
      </div>

      {successMessage && (
        <div className="orders-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="orders-error">
          {error}
        </div>
      )}

      {!error && orders.length === 0 ? (
        <div className="orders-empty">
          <h2>No orders yet</h2>
          <p>Your purchased products will appear here.</p>

          <button onClick={() => navigate("/")}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-card-header">
                <div>
                  <span>ORDER ID</span>
                  <strong>
                    #{order._id.slice(-8).toUpperCase()}
                  </strong>
                </div>

                <div>
                  <span>ORDER DATE</span>
                  <strong>{formatDate(order.createdAt)}</strong>
                </div>

                <div>
                  <span>TOTAL AMOUNT</span>
                  <strong>
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </strong>
                </div>

                <span
                  className={`order-status ${getStatusClass(order.status)}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-products">
                {order.items?.map((item, index) => {
                  const productId = String(
                    item.product?._id || item.product || ""
                  );

                  const orderId = String(order._id);
                  const reviewKey = `${orderId}:${productId}`;

                  const submittedReview =
                    reviewDetailsByKey[reviewKey];

                  const draft = reviewDrafts[reviewKey] || {
                    rating: 5,
                    comment: "",
                  };

                  const canReview =
                    order.status?.toLowerCase() === "delivered" &&
                    productId;

                  // Use the image saved in the order first
                  const imageUrl = getImageUrl(
                    item.imageUrl || item.product?.imageUrl
                  );

                  return (
                    <div
                      className="order-product"
                      key={item._id || `${order._id}-${index}`}
                    >
                      {/* Product image */}
                      <div className="order-product-image-wrapper">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.name || item.product?.name || "Product"}
                            className="order-product-image"
                            onError={(event) => {
                              console.error(
                                "Order image failed to load:",
                                event.currentTarget.src
                              );

                              event.currentTarget.style.display = "none";

                              const fallback =
                                event.currentTarget.nextElementSibling;

                              if (fallback) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className="order-product-placeholder"
                          style={{
                            display: imageUrl ? "none" : "flex",
                          }}
                        >
                          No Image
                        </div>
                      </div>

                      <div className="order-product-info">
                        <h3>
                          {item.name || item.product?.name || "Product"}
                        </h3>

                        <p>Quantity: {item.quantity}</p>

                        {canReview &&
                        reviewedProductIds.has(reviewKey) ? (
                          <div className="order-review-posted">
                            <strong className="order-review-complete">
                              ✓ Your review
                            </strong>

                            <div className="order-review-posted-stars">
                              {"★".repeat(
                                Number(submittedReview?.rating) || 0
                              )}
                              {"☆".repeat(
                                5 -
                                  (Number(submittedReview?.rating) || 0)
                              )}
                            </div>

                            <p>
                              {submittedReview?.comment ||
                                "Your review was submitted."}
                            </p>
                          </div>
                        ) : canReview &&
                          activeReviewProductId === reviewKey ? (
                          <form
                            className="order-review-form"
                            onSubmit={(event) =>
                              handleSubmitReview(
                                event,
                                orderId,
                                productId,
                                reviewKey
                              )
                            }
                          >
                            <label>Your rating</label>

                            <div className="order-review-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={
                                    star <= draft.rating ? "selected" : ""
                                  }
                                  onClick={() =>
                                    updateReviewDraft(reviewKey, {
                                      rating: star,
                                    })
                                  }
                                  aria-label={`Rate ${star} out of 5`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>

                            <label htmlFor={`review-${reviewKey}`}>
                              Your review
                            </label>

                            <textarea
                              id={`review-${reviewKey}`}
                              value={draft.comment}
                              onChange={(event) =>
                                updateReviewDraft(reviewKey, {
                                  comment: event.target.value,
                                })
                              }
                              placeholder="Share your experience with this product..."
                              rows="3"
                              maxLength="1000"
                              required
                            />

                            {reviewMessages[reviewKey] && (
                              <p className="order-review-message">
                                {reviewMessages[reviewKey]}
                              </p>
                            )}

                            <div className="order-review-actions">
                              <button
                                type="submit"
                                disabled={submittingReviewId === reviewKey}
                              >
                                {submittingReviewId === reviewKey
                                  ? "Submitting..."
                                  : "Submit review"}
                              </button>

                              <button
                                type="button"
                                className="order-review-cancel"
                                onClick={() =>
                                  setActiveReviewProductId(null)
                                }
                                disabled={submittingReviewId === reviewKey}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : canReview ? (
                          <div className="order-review-entry">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReviewProductId(reviewKey);

                                setReviewMessages((current) => ({
                                  ...current,
                                  [reviewKey]: "",
                                }));
                              }}
                            >
                              Rate this product
                            </button>

                            {reviewMessages[reviewKey] && (
                              <p className="order-review-message">
                                {reviewMessages[reviewKey]}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <strong>
                        ₹
                        {(
                          Number(item.price) * Number(item.quantity)
                        ).toFixed(2)}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="order-card-footer">
                <span>
                  Payment: {order.paymentStatus || "Pending"}
                </span>

                <button
                  onClick={() =>
                    setExpandedOrder(
                      expandedOrder === order._id ? null : order._id
                    )
                  }
                >
                  {expandedOrder === order._id
                    ? "Hide Details"
                    : "View Details"}
                </button>
              </div>

              {expandedOrder === order._id && (
                <div className="order-extra-details">
                  <h3>Shipping Address</h3>

                  <p>{order.shippingAddress?.fullName}</p>
                  <p>{order.shippingAddress?.phone}</p>
                  <p>{order.shippingAddress?.address}</p>

                  <p>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.postalCode}
                  </p>

                  <p className="order-payment-status">
                    Payment Status: {order.paymentStatus}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}