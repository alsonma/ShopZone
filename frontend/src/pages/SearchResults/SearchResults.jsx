import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import ProductCard from "../../components/ProductCard/ProductCard";
import API from "../../api/axios";
import "./SearchResults.css";

export default function SearchResults() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [search, setSearch] = useState(query);
    const [products, setProducts] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cartMessage, setCartMessage] = useState("");

    useEffect(() => {
        setSearch(query);
    }, [query]);

    useEffect(() => {
        let active = true;

        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await API.get("/products");
                if (active) setProducts(response.data.products || []);
            } catch (err) {
                if (active) {
                    setError(err.response?.data?.message || "We couldn't load products. Please try again.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchProducts();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const fetchCartCount = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user") || "null");
                if (!localStorage.getItem("token") || user?.role !== "customer") {
                    if (active) setCartCount(0);
                    return;
                }

                const response = await API.get("/cart");
                const items = response.data.cart?.items || [];
                if (active) {
                    setCartCount(items.reduce((total, item) => total + Number(item.quantity || 0), 0));
                }
            } catch {
                if (active) setCartCount(0);
            }
        };

        fetchCartCount();
        window.addEventListener("cartUpdated", fetchCartCount);
        return () => {
            active = false;
            window.removeEventListener("cartUpdated", fetchCartCount);
        };
    }, []);

    const results = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return [];

        return products.filter((product) =>
            [product.name, product.desc, product.description, product.category]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [products, query]);

    const addToCart = async (product) => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            if (!localStorage.getItem("token") || !user) {
                setCartMessage("Please log in to add products to your cart.");
                return;
            }
            if (user.role !== "customer") {
                setCartMessage("Shopping is available for customer accounts only.");
                return;
            }
            if (Number(product.stock) <= 0) {
                setCartMessage("This product is currently out of stock.");
                return;
            }

            await API.post("/cart/add", { productId: product._id, quantity: 1 });
            window.dispatchEvent(new Event("cartUpdated"));
            setCartMessage(`${product.name} was added to your cart.`);
        } catch (err) {
            setCartMessage(err.response?.data?.message || "Unable to add this product to your cart.");
        }
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        const next = value.trim();
        if (next) setSearchParams({ q: next }, { replace: true });
        else setSearchParams({}, { replace: true });
    };

    return (
        <div className="search-page">
            <Navbar search={search} setSearch={handleSearchChange} cartCount={cartCount} products={products} />

            <main className="search-page-main">
                <button className="search-back-link" type="button" onClick={() => navigate(-1)}>
                    ← Back
                </button>

                <header className="search-results-heading">
                    <p className="search-eyebrow">SHOPZONE SEARCH</p>
                    <h1>Results for <em>“{query || "..."}”</em></h1>
                    <p>
                        {loading
                            ? "Finding products for you..."
                            : `${results.length} ${results.length === 1 ? "product" : "products"} found`}
                    </p>
                </header>

                {cartMessage && (
                    <div className="search-cart-feedback" role="status">{cartMessage}</div>
                )}

                {loading ? (
                    <div className="search-state">Loading products...</div>
                ) : error ? (
                    <div className="search-state search-error">
                        <p>{error}</p>
                        <button type="button" onClick={() => window.location.reload()}>Try again</button>
                    </div>
                ) : results.length > 0 ? (
                    <div className="search-results-grid">
                        {results.map((product) => (
                            <ProductCard key={product._id} product={product} onAddToCart={addToCart} />
                        ))}
                    </div>
                ) : (
                    <div className="search-empty-state">
                        <span aria-hidden="true">⌕</span>
                        <h2>No matching products yet</h2>
                        <p>Try a different product name or category.</p>
                        <button type="button" onClick={() => navigate("/")}>Browse all products</button>
                    </div>
                )}
            </main>

            <footer className="search-footer">
                <span className="brand">Shop<span>Zone</span><b>.</b></span>
                <p>Better finds. Better everyday.</p>
            </footer>
        </div>
    );
}
