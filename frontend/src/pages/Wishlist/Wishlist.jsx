import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./Wishlist.css";

const SERVER_URL = "http://localhost:5000";

const getImageUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
};

export default function Wishlist() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/customer/wishlist");

      const data = response.data;

      const items = Array.isArray(data)
        ? data
        : data.wishlist?.items ||
          data.wishlist ||
          data.items ||
          data.products ||
          [];

      // Support both populated wishlist products and wishlist item objects.
      const wishlistProducts = items
        .map((item) => item.product || item)
        .filter((product) => product && product._id);

      setProducts(wishlistProducts);
    } catch (err) {
      console.error("Wishlist error:", err);

      if (err.response?.status === 401) {
        setError("Please login to view your wishlist.");
      } else {
        setError(
          err.response?.data?.message || "Unable to load your wishlist."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);
      setMessage("");
      setError("");

      await API.delete(`/customer/wishlist/${productId}`);

      setProducts((prev) =>
        prev.filter((product) => product._id !== productId)
      );

      window.dispatchEvent(new Event("wishlistUpdated"));
      setMessage("Product removed from wishlist.");
    } catch (err) {
      console.error("Remove wishlist error:", err);
      setError(
        err.response?.data?.message || "Failed to remove product."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      setAddingId(product._id);
      setMessage("");
      setError("");

      if (product.stock <= 0) {
        setError("This product is currently out of stock.");
        return;
      }

      await API.post("/cart/add", {
        productId: product._id,
        quantity: 1,
      });

      window.dispatchEvent(new Event("cartUpdated"));
      setMessage(`${product.name} added to your cart.`);
    } catch (err) {
      console.error("Add to cart error:", err);

      if (err.response?.status === 401) {
        setError("Please login to add products to your cart.");
      } else {
        setError(
          err.response?.data?.message || "Failed to add product to cart."
        );
      }
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <p className="wishlist-loading">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-heading">
          <div>
            <p className="wishlist-subtitle">YOUR SAVED COLLECTION</p>
            <h1>My Wishlist</h1>
            <p className="wishlist-count">
              {products.length} {products.length === 1 ? "item" : "items"}
            </p>
          </div>

          <button
            className="wishlist-continue-button"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>

        {message && <p className="wishlist-success">{message}</p>}
        {error && <p className="wishlist-error">{error}</p>}

        {products.length === 0 ? (
          <div className="wishlist-empty">
            <div className="wishlist-empty-icon">♡</div>
            <h2>Your wishlist is empty</h2>
            <p>
              Save the products you love and come back to them whenever
              you want.
            </p>
            <button onClick={() => navigate("/")}>
              Explore Products
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {products.map((product) => {
              const outOfStock = product.stock <= 0;

              return (
                <div className="wishlist-card" key={product._id}>
                  <div
                    className="wishlist-image"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {product.imageUrl ? (
                      <img
                        src={getImageUrl(product.imageUrl)}
                        alt={product.name}
                      />
                    ) : (
                      <div className="wishlist-no-image">
                        No Image Available
                      </div>
                    )}

                    {outOfStock && (
                      <span className="wishlist-stock-badge">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="wishlist-product-info">
                    <p className="wishlist-category">
                      {product.category}
                    </p>

                    <h3
                      onClick={() =>
                        navigate(`/product/${product._id}`)
                      }
                    >
                      {product.name}
                    </h3>

                    <p className="wishlist-price">
                      ₹{Number(product.price || 0).toLocaleString("en-IN")}
                    </p>

                    <div className="wishlist-card-actions">
                      <button
                        className="wishlist-cart-button"
                        disabled={outOfStock || addingId === product._id}
                        onClick={() => handleAddToCart(product)}
                      >
                        {addingId === product._id
                          ? "Adding..."
                          : outOfStock
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </button>

                      <button
                        className="wishlist-remove-button"
                        disabled={removingId === product._id}
                        onClick={() => handleRemove(product._id)}
                        title="Remove from wishlist"
                      >
                        {removingId === product._id ? "..." : "♥"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}