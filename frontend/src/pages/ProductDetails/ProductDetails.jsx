
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./ProductDetails.css";

const SERVER_URL = "http://localhost:5000";

const getImageUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
};

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [store, setStore] = useState(null);
    const [reviews, setReviews] = useState([]);

    const [summary, setSummary] = useState({
        averageRating: 0,
        totalReviews: 0
    });

    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [addingToWishlist, setAddingToWishlist] = useState(false);

    const [isWishlisted, setIsWishlisted] = useState(false);

    const [error, setError] = useState("");
    const [cartMessage, setCartMessage] = useState("");
    const [wishlistMessage, setWishlistMessage] = useState("");

    // FETCH PRODUCT DETAILS
    const fetchProduct = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get(`/products/${id}`);

            setProduct(response.data.product);
            setStore(response.data.store);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load product details."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    // FETCH PRODUCT REVIEWS
    const fetchReviews = useCallback(async () => {
        try {
            const response = await API.get(`/reviews/${id}`);

            setReviews(response.data.reviews || []);

            setSummary(response.data.summary || {
                averageRating: 0,
                totalReviews: 0
            });
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        }
    }, [id]);

    // CHECK WHETHER PRODUCT IS ALREADY WISHLISTED
    const fetchWishlistStatus = useCallback(async () => {
        try {
            const response = await API.get("/customer/wishlist");

            const data = response.data;

            const items = Array.isArray(data)
                ? data
                : data.wishlist?.items ||
                  data.wishlist ||
                  data.items ||
                  data.products ||
                  [];

            const exists = items.some((item) => {
                const productId =
                    item.product?._id ||
                    item.product ||
                    item._id ||
                    item;

                return String(productId) === String(id);
            });

            setIsWishlisted(exists);

        } catch (err) {
            // Wishlist may not be accessible when the user is logged out.
            console.log("Wishlist status unavailable.");
        }
    }, [id]);

    useEffect(() => {
        fetchProduct();
        fetchReviews();
        fetchWishlistStatus();
    }, [fetchProduct, fetchReviews, fetchWishlistStatus]);

    // ADD TO CART
    const handleAddToCart = async () => {
        if (Number(product.stock) <= 0) return;

        try {
            setAddingToCart(true);
            setCartMessage("");

            await API.post("/cart/add", {
                productId: product._id,
                quantity: 1
            });

            // Update cart count in Navbar
            window.dispatchEvent(new Event("cartUpdated"));

            setCartMessage("✓ Product added to your cart!");

        } catch (err) {
            if (err.response?.status === 401) {
                setCartMessage("Please login to add products to your cart.");
            } else {
                setCartMessage(
                    err.response?.data?.message ||
                    "Unable to add product to cart."
                );
            }
        } finally {
            setAddingToCart(false);
        }
    };

    // ADD OR REMOVE FROM WISHLIST
    const handleWishlist = async () => {
        try {
            setAddingToWishlist(true);
            setWishlistMessage("");

            if (isWishlisted) {
                await API.delete(`/customer/wishlist/${product._id}`);

                setIsWishlisted(false);
                setWishlistMessage("Removed from your wishlist.");
            } else {
                await API.post(`/customer/wishlist/${product._id}`);

                setIsWishlisted(true);
                setWishlistMessage("♥ Added to your wishlist!");
            }

            window.dispatchEvent(new Event("wishlistUpdated"));

        } catch (err) {
            if (err.response?.status === 401) {
                setWishlistMessage("Please login to use your wishlist.");
            } else {
                setWishlistMessage(
                    err.response?.data?.message ||
                    "Unable to update wishlist."
                );
            }
        } finally {
            setAddingToWishlist(false);
        }
    };

    if (loading) {
        return <div className="details-loading">Loading product...</div>;
    }

    if (error || !product) {
        return (
            <div className="details-error">
                <h2>Product unavailable</h2>
                <p>{error || "This product could not be found."}</p>

                <button onClick={() => navigate("/")}>
                    Back to Shop
                </button>
            </div>
        );
    }

    const price = Number(product.price).toLocaleString("en-IN");
    const outOfStock = Number(product.stock) <= 0;

    return (
        <main className="product-details-page">

            <button
                className="details-back-button"
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>

            {/* PRODUCT INFORMATION */}
            <section className="details-main">

                <div className="details-image-wrapper">
                    {product.imageUrl ? (
                        <img
                            src={getImageUrl(product.imageUrl)}
                            alt={product.name}
                            className="details-product-image"
                        />
                    ) : (
                        <div className="details-image-placeholder">
                            SHOPZONE
                        </div>
                    )}
                </div>

                <div className="details-product-info">

                    <span className="details-category">
                        {product.category}
                    </span>

                    <h1>{product.name}</h1>

                    <div className="details-rating">
                        <span className="rating-stars">
                            {"★".repeat(Math.round(summary.averageRating))}
                            {"☆".repeat(5 - Math.round(summary.averageRating))}
                        </span>

                        <span>
                            {summary.averageRating.toFixed(1)} / 5
                        </span>

                        <span>
                            ({summary.totalReviews} reviews)
                        </span>
                    </div>

                    <h2 className="details-price">₹{price}</h2>

                    <p className="details-description">
                        {product.desc || "No product description available."}
                    </p>

                    <div className="details-stock">
                        <span>Availability</span>

                        <strong className={outOfStock ? "unavailable" : "available"}>
                            {outOfStock
                                ? "Out of stock"
                                : `${product.stock} available`}
                        </strong>
                    </div>

                    <div className="details-seller">
                        <span>Sold by</span>

                        <strong>
                            {store?.storeName || "Store information unavailable"}
                        </strong>
                    </div>

                    {/* CART AND WISHLIST BUTTONS */}
                    <div className="details-action-buttons">

                        <button
                            className="details-add-button"
                            disabled={outOfStock || addingToCart}
                            onClick={handleAddToCart}
                        >
                            {outOfStock
                                ? "Out of Stock"
                                : addingToCart
                                    ? "Adding..."
                                    : "Add to Cart"}
                        </button>

                        <button
                            className={`details-wishlist-button ${
                                isWishlisted ? "active" : ""
                            }`}
                            disabled={addingToWishlist}
                            onClick={handleWishlist}
                        >
                            {addingToWishlist
                                ? "Updating..."
                                : isWishlisted
                                    ? "♥ Wishlisted"
                                    : "♡ Add to Wishlist"}
                        </button>

                    </div>

                    {cartMessage && (
                        <p className="details-action-message">
                            {cartMessage}
                        </p>
                    )}

                    {wishlistMessage && (
                        <p className="details-action-message">
                            {wishlistMessage}
                        </p>
                    )}

                    <p className="details-note">
                        Product details and availability are provided by the seller.
                    </p>

                </div>
            </section>

            {/* STORE INFORMATION */}
            <section className="details-store-section">

                <div className="details-section-heading">
                    <span>THE SELLER</span>
                    <h2>Store Information</h2>
                </div>

                {store ? (
                    <div className="store-information">

                        <div className="store-logo">
                            {store.logo ? (
                                <img
                                    src={getImageUrl(store.logo)}
                                    alt={store.storeName}
                                />
                            ) : (
                                <span>
                                    {store.storeName.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="store-details">
                            <h3>{store.storeName}</h3>

                            <p>
                                {store.description ||
                                    "Welcome to our ShopZone store."}
                            </p>

                            {store.phone && (
                                <p>
                                    <strong>Contact:</strong> {store.phone}
                                </p>
                            )}

                            {store.address?.fullAddress && (
                                <p>
                                    <strong>Address:</strong>{" "}
                                    {store.address.fullAddress}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="no-store">
                        Store information is not available.
                    </p>
                )}
            </section>

            {/* CUSTOMER REVIEWS */}
            <section className="details-reviews-section">

                <div className="details-section-heading">
                    <span>CUSTOMER FEEDBACK</span>
                    <h2>Ratings & Reviews</h2>
                </div>

                <div className="review-summary">
                    <strong>{summary.averageRating.toFixed(1)}</strong>

                    <div>
                        <div className="rating-stars">
                            {"★".repeat(Math.round(summary.averageRating))}
                            {"☆".repeat(5 - Math.round(summary.averageRating))}
                        </div>

                        <p>
                            Based on {summary.totalReviews} customer reviews
                        </p>
                    </div>
                </div>

                {/* Reviews are submitted from a delivered order in My Orders. */}
                <div className="review-form-wrapper">
                    <h3>Purchased this product?</h3>
                    <p>
                        After the order is delivered, go to My Orders and select
                        “Rate this product” on that order.
                    </p>
                </div>

                {/* REVIEW LIST */}
                <div className="review-list">

                    <h3>Customer Reviews ({reviews.length})</h3>

                    {reviews.length === 0 ? (
                        <p className="no-reviews">
                            No reviews yet. Be the first to share your experience!
                        </p>
                    ) : (
                        reviews.map((review) => (
                            <article
                                className="review-card"
                                key={review._id}
                            >
                                <div className="review-card-top">
                                    <strong>
                                        {review.user?.name || "Customer"}
                                    </strong>

                                    <span>
                                        {new Date(review.createdAt).toLocaleDateString(
                                            "en-IN",
                                            {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric"
                                            }
                                        )}
                                    </span>
                                </div>

                                <div className="rating-stars">
                                    {"★".repeat(review.rating)}
                                    {"☆".repeat(5 - review.rating)}
                                </div>

                                <p>{review.comment}</p>
                            </article>
                        ))
                    )}

                </div>
            </section>

        </main>
    );
}
