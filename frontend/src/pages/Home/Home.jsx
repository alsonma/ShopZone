
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Laptop,
  Shirt,
  House,
  Sparkles,
  Dumbbell,
  BookOpen,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Navbar from "../../components/Navbar/Navbar";
import ProductCard from "../../components/ProductCard/ProductCard";
import "./Home.css";
import API from "../../api/axios";

// =====================================
// CATEGORY ICONS
// =====================================

const categoryIcons = {
  all: LayoutGrid,
  electronics: Laptop,
  fashion: Shirt,
  "home & living": House,
  beauty: Sparkles,
  sports: Dumbbell,
  books: BookOpen,
  toys: Gamepad2,
};

export default function App() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [promoIndex, setPromoIndex] = useState(0);

  const [cartCount, setCartCount] = useState(0);
  const [cartMessage, setCartMessage] = useState("");
  const [showLoginButton, setShowLoginButton] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================
  // FETCH PRODUCTS
  // =====================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/products");

        setProducts(response.data.products || []);
      } catch (err) {
        console.error("Product loading error:", err);

        setError(
          "We couldn't load the products. Check your backend connection."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    window.addEventListener("reviewsUpdated", fetchProducts);
    return () => window.removeEventListener("reviewsUpdated", fetchProducts);
  }, []);

  // =====================================
  // FETCH CART COUNT FROM BACKEND
  // =====================================

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const token = localStorage.getItem("token");

        const user = JSON.parse(
          localStorage.getItem("user") || "null"
        );

        // Only customers can have a shopping cart
        if (!token || user?.role !== "customer") {
          setCartCount(0);
          return;
        }

        const response = await API.get("/cart");

        const items = response.data.cart?.items || [];

        const total = items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        setCartCount(total);
      } catch (err) {
        console.error("Cart count error:", err);
      }
    };

    fetchCartCount();

    window.addEventListener("cartUpdated", fetchCartCount);

    return () => {
      window.removeEventListener("cartUpdated", fetchCartCount);
    };
  }, []);

  // =====================================
  // ADD PRODUCT TO CART
  // =====================================

  const addToCart = async (product) => {
    try {
      const token = localStorage.getItem("token");

      const user = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      // Check login
      if (!token || !user) {
        setShowLoginButton(true);

        setCartMessage(
          "Please log in to your account to add products to your cart."
        );

        return;
      }

      // Only customers can shop
      if (user.role !== "customer") {
        setShowLoginButton(false);

        setCartMessage(
          "Shopping is available for customer accounts only."
        );

        return;
      }

      // Check product stock
      if (Number(product.stock) <= 0) {
        setShowLoginButton(false);

        setCartMessage(
          "Sorry, this product is currently out of stock."
        );

        return;
      }

      setCartMessage("");
      setShowLoginButton(false);

      // Send product to backend
      await API.post("/cart/add", {
        productId: product._id,
        quantity: 1,
      });

      // Refresh Navbar cart count
      window.dispatchEvent(new Event("cartUpdated"));

      setCartMessage(
        `${product.name} has been successfully added to your cart.`
      );
    } catch (err) {
      console.error("Add to cart error:", err);

      if (err.response?.status === 401) {
        setCartMessage(
          "Your session has expired. Please log in again to continue shopping."
        );

        setShowLoginButton(true);
      } else if (err.response?.status === 403) {
        setCartMessage(
          "You don't have permission to add products to the cart."
        );

        setShowLoginButton(false);
      } else {
        setCartMessage(
          err.response?.data?.message === "Access denied. Login first"
            ? "Please log in to your account to add products to your cart."
            : "We couldn't add this product to your cart. Please try again."
        );

        setShowLoginButton(false);
      }
    }
  };

  // =====================================
  // CATEGORY LIST
  // =====================================

  const categories = useMemo(() => {
    const uniqueCategories = new Map();
    products.forEach((product) => {
      const label = product.category?.trim();
      if (label) uniqueCategories.set(label.toLowerCase(), label);
    });
    return ["All", ...uniqueCategories.values()];
  }, [products]);

  // =====================================
  // SEARCH AND CATEGORY FILTER
  // =====================================

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        category === "All" ||
        product.category?.trim().toLowerCase() === category.trim().toLowerCase()
    );
  }, [products, category]);

  const trendingProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => {
          const reviewsA = Number(a.totalReviews) || 0;
          const reviewsB = Number(b.totalReviews) || 0;
          const ratingA = Number(a.averageRating) || 0;
          const ratingB = Number(b.averageRating) || 0;
          return reviewsB - reviewsA || ratingB - ratingA;
        })
        .slice(0, 8),
    [products]
  );

  useEffect(() => {
    if (trendingProducts.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setPromoIndex((current) => (current + 1) % trendingProducts.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [trendingProducts.length]);

  const activePromo = trendingProducts.length
    ? trendingProducts[promoIndex % trendingProducts.length]
    : null;

  const movePromo = (direction) => {
    if (!trendingProducts.length) return;
    setPromoIndex((current) =>
      (current + direction + trendingProducts.length) % trendingProducts.length
    );
  };

  const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    const serverUrl = (API.defaults.baseURL || "").replace(/\/api\/?$/, "");
    return `${serverUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  };

  const selectCategory = (item) => {
    setCategory(item);
    window.requestAnimationFrame(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // =====================================
  // GET CATEGORY ICON
  // =====================================

  const getCategoryIcon = (name) =>
    categoryIcons[name.toLowerCase()] || LayoutGrid;

  // =====================================
  // HOME PAGE UI
  // =====================================

  return (
    <div className="shop-app">

      {/* NAVBAR */}

      <Navbar
        search={search}
        setSearch={setSearch}
        cartCount={cartCount}
        products={products}
      />

      <main className="store-main">

        {/* HERO SECTION */}

        <section className="premium-hero">
          <div className="hero-copy">

            <p className="eyebrow">
              PREMIUM QUALITY <span>✳</span> BETTER LIVING
            </p>

            <h1>
              Discover Products
              <br />
              That Fit <em>Your Life</em>
            </h1>

            <p className="hero-description">
              Modern essentials, curated for comfort, style
              and everyday happiness.
            </p>

            <a href="#products" className="hero-button">
              Shop Now <span>→</span>
            </a>

            <div className="hero-benefits">

              <div>
                <span className="benefit-icon">♧</span>
                <p>
                  <strong>Free Shipping</strong>
                  <small>On eligible orders</small>
                </p>
              </div>

              <div>
                <span className="benefit-icon">◇</span>
                <p>
                  <strong>Secure Payments</strong>
                  <small>Safe checkout</small>
                </p>
              </div>

              <div>
                <span className="benefit-icon">♡</span>
                <p>
                  <strong>Friendly Support</strong>
                  <small>Here to help</small>
                </p>
              </div>

            </div>
          </div>

          <div className="hero-visual">

            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />

            <div className="hero-product-mark">
              <span>THE ART OF</span>

              <strong>
                GOOD
                <br />
                FINDS.
              </strong>

              <i>✳</i>
            </div>

            <p className="hero-side-note">
              MADE FOR EVERYDAY LIVING
            </p>

          </div>
        </section>

        {/* CATEGORY SECTION */}

        <section
          className="category-section"
          id="categories"
          aria-label="Product categories"
        >
          <div className="category-tiles">

            {categories.map((item) => {
              const CategoryIcon = getCategoryIcon(item);

              return (
                <button
                  key={item}
                  type="button"
                  className={
                    category === item
                      ? "category-tile selected"
                      : "category-tile"
                  }
                  onClick={() => selectCategory(item)}
                >
                  <span className="category-symbol">
                    <CategoryIcon
                      size={22}
                      strokeWidth={1.7}
                    />
                  </span>

                  <span>{item}</span>

                  {category === item && (
                    <span className="category-arrow">
                      →
                    </span>
                  )}
                </button>
              );
            })}

          </div>
        </section>

        {/* PRODUCT IMAGE SALE SPOTLIGHT CAROUSEL */}
        {!loading && !error && activePromo && (
          <section className="sale-carousel" id="trending" aria-label="ShopZone sale spotlight">
            <div className="sale-carousel-copy">
              <p className="sale-kicker"><span>SALE SPOTLIGHT</span> · TRENDING FINDS</p>
              <p className="sale-counter">{String((promoIndex % trendingProducts.length) + 1).padStart(2, "0")} / {String(trendingProducts.length).padStart(2, "0")}</p>
              <h2>{activePromo.name}</h2>
              <p className="sale-category">{activePromo.category || "Featured find"}</p>
              <p className="sale-description">
                A customer favourite, selected for this week’s ShopZone spotlight.
              </p>
              <div className="sale-price-row">
                <span>Shop for</span>
                <strong>₹{Number(activePromo.price || 0).toLocaleString("en-IN")}</strong>
              </div>
              <button
                type="button"
                className="sale-shop-button"
                onClick={() => navigate(`/product/${activePromo._id}`)}
              >
                Explore this find <span>→</span>
              </button>
              <div className="sale-dots" aria-label="Choose featured product">
                {trendingProducts.map((product, index) => (
                  <button
                    key={product._id}
                    type="button"
                    className={index === promoIndex % trendingProducts.length ? "active" : ""}
                    onClick={() => setPromoIndex(index)}
                    aria-label={`Show ${product.name}`}
                  />
                ))}
              </div>
            </div>

            <div className="sale-carousel-visual">
              <span className="sale-badge">SHOP<br />THE<br />SALE</span>
              <div className="sale-image-placeholder">
                <span>{activePromo.category || "SHOPZONE"}</span>
                <strong>{activePromo.name}</strong>
              </div>
              {activePromo.imageUrl ? (
                <img
                  key={activePromo._id}
                  src={getProductImageUrl(activePromo.imageUrl)}
                  alt={activePromo.name}
                  onError={(event) => { event.currentTarget.style.display = "none"; }}
                />
              ) : null}
              <div className="sale-carousel-controls">
                <button type="button" onClick={() => movePromo(-1)} aria-label="Previous featured product">
                  <ChevronLeft size={20} />
                </button>
                <button type="button" onClick={() => movePromo(1)} aria-label="Next featured product">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PRODUCTS SECTION */}

        <section className="products-section" id="products">

          <div className="products-heading">

            <div>
              <p className="eyebrow gold-eyebrow">
                THE COLLECTION
              </p>

              <h2>
                {category === "All"
                  ? "Featured Products"
                  : category}
                <span>.</span>
              </h2>

              <p className="products-subtitle">
                Thoughtfully picked products for your everyday.
              </p>
            </div>

            <p className="products-count">
              {filteredProducts.length} products
            </p>

          </div>

          {/* CART FEEDBACK */}

          {cartMessage && (
            <div
              className="cart-feedback"
              aria-live="polite"
            >
              <span>{cartMessage}</span>

              {showLoginButton && (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Login Now →
                </button>
              )}
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div className="store-status">
              <span className="loading-dot" />
              Finding your favourites...
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="store-status error-state">

              <p>{error}</p>

              <button
                onClick={() => window.location.reload()}
              >
                Try again
              </button>

            </div>
          )}

          {/* EMPTY PRODUCTS */}

          {!loading &&
            !error &&
            filteredProducts.length === 0 && (
              <div className="store-status">
                No products found. Try another category or search.
              </div>
            )}

          {/* PRODUCT GRID */}

          {!loading &&
            !error &&
            filteredProducts.length > 0 && (
              <div className="product-grid">

                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}

              </div>
            )}

        </section>

        <section className="shop-guide" aria-labelledby="shop-guide-title">
          <div className="shop-guide-heading">
            <p className="eyebrow gold-eyebrow">SHOP WITH CONFIDENCE</p>
            <h2 id="shop-guide-title">A better way to find your next favourite.</h2>
          </div>
          <div className="shop-guide-grid">
            <article>
              <span>01</span>
              <h3>Find what fits</h3>
              <p>Browse categories or search the collection to find products that suit your day-to-day.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Compare the details</h3>
              <p>Explore product descriptions, availability, seller information, and customer ratings.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Buy from a seller</h3>
              <p>Place your order through ShopZone, then track its progress from your account.</p>
            </article>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-mark" aria-hidden="true">S<span>.</span></div>
          <div className="about-copy">
            <p className="eyebrow gold-eyebrow">A LITTLE ABOUT US</p>
            <h2>Good finds make<br />everyday living better.</h2>
            <p>
              ShopZone brings together useful, well-chosen products from
              independent sellers. Browse with confidence, compare customer
              ratings, and find something that feels right for your everyday.
            </p>
            <a href="#products" className="about-link">Explore the collection <span>→</span></a>
          </div>
          <div className="about-points">
            <div><strong>01</strong><span>Thoughtful finds</span></div>
            <div><strong>02</strong><span>Independent sellers</span></div>
            <div><strong>03</strong><span>Real customer reviews</span></div>
          </div>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="premium-footer">

        <a href="/" className="brand">
          Shop<span>Zone</span><b>.</b>
        </a>

        <p>Better finds. Better everyday.</p>

        <p>
          © {new Date().getFullYear()} ShopZone
        </p>

      </footer>

    </div>
  );
}
