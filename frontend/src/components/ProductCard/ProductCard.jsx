
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./ProductCard.css";

// Shared wishlist cache so multiple product cards can reuse one API request.
let wishlistCache = null;
let wishlistRequest = null;

const fetchWishlistIds = async () => {
    if (wishlistCache !== null) {
        return wishlistCache;
    }

    if (wishlistRequest) {
        return wishlistRequest;
    }

    wishlistRequest = API.get("/customer/wishlist")
        .then((response) => {
            const data = response.data;

            const items = Array.isArray(data)
                ? data
                : data.wishlist?.items ||
                  data.wishlist ||
                  data.items ||
                  data.products ||
                  [];

            const ids = new Set(
                items
                    .map((item) => {
                        const product = item.product || item;
                        return product?._id || product;
                    })
                    .filter(Boolean)
                    .map(String)
            );

            wishlistCache = ids;
            return ids;
        })
        .finally(() => {
            wishlistRequest = null;
        });

    return wishlistRequest;
};

export default function ProductCard({ product, onAddToCart }) {
    const navigate = useNavigate();

    const [wishlisted, setWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [added, setAdded] = useState(false);

    const outOfStock = Number(product.stock) <= 0;

    const imageUrl = product.imageUrl
        ? (/^https?:\/\//i.test(product.imageUrl)
            ? product.imageUrl
            : `${(API.defaults.baseURL || "").replace(/\/api\/?$/, "")}${product.imageUrl.startsWith("/") ? "" : "/"}${product.imageUrl}`)
        : "";

    const price = Number(product.price).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });

    // Load the customer's existing wishlist status.
    useEffect(() => {
        let active = true;

        const loadWishlistStatus = async () => {
            try {
                const ids = await fetchWishlistIds();

                if (active) {
                    setWishlisted(ids.has(String(product._id)));
                }
            } catch (error) {
                console.error("Could not load wishlist:", error);
            }
        };

        loadWishlistStatus();

        // Listen for wishlist changes made elsewhere in the app.
        const handleWishlistUpdate = async () => {
            wishlistCache = null;

            try {
                const ids = await fetchWishlistIds();

                if (active) {
                    setWishlisted(ids.has(String(product._id)));
                }
            } catch (error) {
                console.error("Could not refresh wishlist:", error);
            }
        };

        window.addEventListener("wishlistUpdated", handleWishlistUpdate);

        return () => {
            active = false;
            window.removeEventListener(
                "wishlistUpdated",
                handleWishlistUpdate
            );
        };
    }, [product._id]);

    const openDetails = () => {
        navigate(`/product/${product._id}`);
    };

    const handleAdd = () => {
        if (outOfStock) return;

        onAddToCart(product);
        setAdded(true);

        window.setTimeout(() => setAdded(false), 1000);
    };

    // Add or remove this product from the wishlist.
    const handleWishlist = async (e) => {
        e.stopPropagation();

        if (wishlistLoading) return;

        try {
            setWishlistLoading(true);

            if (wishlisted) {
                await API.delete(`/customer/wishlist/${product._id}`);

                setWishlisted(false);

                if (wishlistCache) {
                    wishlistCache.delete(String(product._id));
                }
            } else {
                await API.post(`/customer/wishlist/${product._id}`);

                setWishlisted(true);

                if (wishlistCache) {
                    wishlistCache.add(String(product._id));
                }
            }

            // Notify the Wishlist page and other product cards.
            window.dispatchEvent(new Event("wishlistUpdated"));
        } catch (error) {
            console.error("Wishlist update error:", error);

            if (error.response?.status === 401) {
                alert("Please login to use your wishlist.");
            } else {
                alert(
                    error.response?.data?.message ||
                    "Unable to update your wishlist. Please try again."
                );
            }
        } finally {
            setWishlistLoading(false);
        }
    };

    return (
        <article className="product-card">
            <div
                className="product-image"
                onClick={openDetails}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter") openDetails();
                }}
                style={{ cursor: "pointer" }}
            >
                {product.imageUrl && !imageFailed ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="product-image-placeholder">
                        <span>SHOPZONE</span>
                        <strong>{product.category || "Essentials"}</strong>
                        <i>✳</i>
                    </div>
                )}

                <span className="category-tag">
                    {product.category || "Collection"}
                </span>

                <button
                    type="button"
                    className={`wishlist-button ${wishlisted ? "wishlisted" : ""}`}
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    aria-label={
                        wishlisted
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                    }
                    aria-pressed={wishlisted}
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill={wishlisted ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                    </svg>
                </button>

                {outOfStock && (
                    <span className="out-of-stock-label">Out of stock</span>
                )}
            </div>

            <div className="product-info">
                <p className="product-category-caption">
                    {product.category || "SHOPZONE EDIT"}
                </p>

                <h3
                    title={product.name}
                    onClick={openDetails}
                    style={{ cursor: "pointer" }}
                >
                    {product.name}
                </h3>

                <div
                    className="product-card-rating"
                    aria-label={`${Number(product.averageRating || 0).toFixed(1)} out of 5 stars, ${product.totalReviews || 0} reviews`}
                >
                    <span className="product-card-stars" aria-hidden="true">
                        {"★".repeat(Math.round(Number(product.averageRating) || 0))}
                        {"☆".repeat(5 - Math.round(Number(product.averageRating) || 0))}
                    </span>
                    <span>{Number(product.averageRating || 0).toFixed(1)}</span>
                    <span>({product.totalReviews || 0} reviews)</span>
                </div>

                <p className="product-description">
                    {product.desc || product.description || "A thoughtful addition to your everyday."}
                </p>

                <button
                    type="button"
                    className="view-details-button"
                    onClick={openDetails}
                >
                    View Product Details →
                </button>

                <div className="product-bottom">
                    <div className="product-price-area">
                        <p className="product-price">₹{price}</p>

                        <p className={outOfStock ? "stock out" : "stock"}>
                            {outOfStock
                                ? "Currently unavailable"
                                : `${product.stock} in stock`}
                        </p>
                    </div>

                    <button
                        type="button"
                        className={`add-button ${added ? "added" : ""}`}
                        disabled={outOfStock}
                        onClick={handleAdd}
                    >
                        {outOfStock ? (
                            "Unavailable"
                        ) : added ? (
                            <>
                                <span aria-hidden="true">✓</span> Added
                            </>
                        ) : (
                            <>
                                <span aria-hidden="true">+</span> Add to bag
                            </>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}

