
import "./Navbar.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";

import {
    UserRound,
    Package,
    Heart,
    MapPin,
    CreditCard,
    LogOut,
    X,
    ChevronRight,
    ShoppingCart,
    Search
} from "lucide-react";

export default function Navbar({ search, setSearch, cartCount, products = [] }) {
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "";
        if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
        const serverUrl = (API.defaults.baseURL || "").replace(/\/api\/?$/, "");
        return `${serverUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    };
    const navigate = useNavigate();
    const searchContainerRef = useRef(null);
    const [searchOpen, setSearchOpen] = useState(false);

    const suggestions = useMemo(() => {
        const query = search.trim().toLowerCase();
        const matchingProducts = query
            ? products.filter((product) =>
                [product.name, product.category, product.desc, product.description]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(query))
            )
            : products;

        return matchingProducts.slice(0, 5);
    }, [products, search]);

    const submitSearch = (event) => {
        event.preventDefault();
        const query = search.trim();
        if (query) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setSearchOpen(false);
        }
    };

    useEffect(() => {
        const closeSearchOnOutsideClick = (event) => {
            if (!searchContainerRef.current?.contains(event.target)) {
                setSearchOpen(false);
            }
        };

        document.addEventListener("mousedown", closeSearchOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeSearchOnOutsideClick);
    }, []);

    const [accountOpen, setAccountOpen] = useState(false);

    // Get logged-in user from localStorage
    const [user, setUser] = useState(() => {
        return JSON.parse(localStorage.getItem("user") || "null");
    });

    // Listen for login and logout changes
    useEffect(() => {
        const updateUser = () => {
            const savedUser = JSON.parse(
                localStorage.getItem("user") || "null"
            );

            setUser(savedUser);
            setAccountOpen(false);
        };

        window.addEventListener("authChanged", updateUser);

        return () => {
            window.removeEventListener("authChanged", updateUser);
        };
    }, []);

    // Check whether the user can access the account sidebar
    const canOpenAccount =
        user && (user.role === "customer" || user.role === "seller");

    // User's first letter
    const profileLetter =
        user?.name?.charAt(0).toUpperCase() || "U";

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setAccountOpen(false);

        window.dispatchEvent(new Event("authChanged"));

        navigate("/");
    };

    // Close sidebar
    const closeAccount = () => {
        setAccountOpen(false);
    };

    return (
        <>
            <header className={`navbar ${searchOpen ? "search-open" : ""}`}>

                {/* Brand */}
                <Link to="/" className="brand" aria-label="ShopZone home">
                    Shop<span>Zone</span><b>.</b>
                </Link>

                {/* Navigation */}
                <nav className="nav-links" aria-label="Main navigation">
                    <Link className="nav-link active" to="/">
                        Home
                    </Link>

                    <a className="nav-link" href="#categories">
                        Categories
                    </a>

                    <a className="nav-link" href="#trending">
                        Trending
                    </a>

                    <a className="nav-link" href="#products">
                        Products
                    </a>

                    <a className="nav-link" href="#about">
                        About
                    </a>
                </nav>

                {/* Search */}
                <form
                    ref={searchContainerRef}
                    className="nav-search"
                    onSubmit={submitSearch}
                    role="search"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="19"
                        height="19"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        aria-hidden="true"
                    >
                        <circle cx="10.8" cy="10.8" r="6.8" />
                        <path d="m16 16 4.2 4.2" />
                    </svg>

                    <input
                        type="search"
                        placeholder="Search for products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setSearchOpen(true)}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") setSearchOpen(false);
                        }}
                        aria-label="Search products"
                    />
                    <button type="submit" className="nav-search-submit" aria-label="Search">
                        <Search size={17} />
                    </button>

                    {searchOpen && (
                        <div className="nav-search-suggestions">
                            <p className="suggestion-heading">
                                {search.trim() ? "SUGGESTIONS" : "POPULAR PICKS"}
                            </p>
                            {suggestions.length > 0 ? suggestions.map((product) => (
                                <button
                                    type="button"
                                    className="search-suggestion"
                                    key={product._id}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                        setSearch(product.name);
                                        setSearchOpen(false);
                                        navigate(`/product/${product._id}`);
                                    }}
                                >
                                    <span className="suggestion-image">
                                        {product.imageUrl ? (
                                            <img src={getImageUrl(product.imageUrl)} alt="" />
                                        ) : (
                                            <Search size={16} />
                                        )}
                                    </span>
                                    <span className="suggestion-copy">
                                        <strong>{product.name}</strong>
                                        <small>{product.category || "ShopZone find"}</small>
                                    </span>
                                    <ChevronRight size={17} />
                                </button>
                            )) : (
                                <p className="suggestion-empty">No quick matches. Press Enter to search all products.</p>
                            )}
                            {search.trim() && (
                                <button type="submit" className="suggestion-view-all">
                                    View all results for “{search.trim()}” <span>→</span>
                                </button>
                            )}
                        </div>
                    )}
                </form>

                {/* Actions */}
                <div className="nav-actions">

                    {/* Become a Seller */}
                    {user?.role === "customer" && (
                        <Link
                            to="/become-seller"
                            className="become-seller-btn"
                        >
                            Become a Seller
                        </Link>
                    )}

                    {/* Customer / Seller Profile or Login */}
                    {canOpenAccount ? (
                        <button
                            className="customer-profile-button"
                            type="button"
                            onClick={() => setAccountOpen(true)}
                            aria-label="Open account menu"
                            title="My Account"
                        >
                            {profileLetter}
                        </button>
                    ) : (
                        <Link
                            className="nav-icon-link"
                            to="/login"
                            aria-label="Login"
                            title="Login"
                        >
                            <UserRound size={23} />
                        </Link>
                    )}

                    {/* Shopping Cart */}
                    <button
                        className="nav-cart"
                        type="button"
                        onClick={() => navigate("/cart")}
                        aria-label={`Shopping cart, ${cartCount} items`}
                        title="Shopping Cart"
                    >
                        <ShoppingCart
                            size={25}
                            strokeWidth={1.7}
                        />

                        <span className="cart-count">{cartCount}</span>
                    </button>

                </div>
            </header>

            {/* Account Sidebar */}
            {accountOpen && canOpenAccount && (
                <div
                    className="account-overlay"
                    onClick={closeAccount}
                >
                    <aside
                        className="account-sidebar"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Sidebar Header */}
                        <div className="account-sidebar-header">
                            <h2>My Account</h2>

                            <button
                                type="button"
                                onClick={closeAccount}
                                aria-label="Close account menu"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* User Information */}
                        <div className="account-user-info">
                            <div className="account-avatar">
                                {profileLetter}
                            </div>

                            <div>
                                <h3>{user.name}</h3>
                                <p>{user.email}</p>
                                <small>
                                    {user.role === "seller" ? "Seller Account" : "Customer Account"}
                                </small>
                            </div>
                        </div>

                        {/* Account Menu */}
                        <div className="account-menu">

                            <Link to="/customer/profile" onClick={closeAccount}>
                                <UserRound />
                                <span>Edit Profile</span>
                                <ChevronRight />
                            </Link>

                            <Link to="/customer/orders" onClick={closeAccount}>
                                <Package />
                                <span>My Orders</span>
                                <ChevronRight />
                            </Link>

                            <Link to="/wishlist" onClick={closeAccount}>
                                <Heart />
                                <span>My Wishlist</span>
                                <ChevronRight />
                            </Link>

                            <Link to="/customer/addresses" onClick={closeAccount}>
                                <MapPin />
                                <span>My Addresses</span>
                                <ChevronRight />
                            </Link>

                            <Link to="/customer/payments" onClick={closeAccount}>
                                <CreditCard />
                                <span>Payment Methods</span>
                                <ChevronRight />
                            </Link>

                        </div>

                        {/* Seller Dashboard Link */}
                        {user.role === "seller" && (
                            <Link
                                to="/seller/dashboard"
                                className="seller-dashboard-link"
                                onClick={closeAccount}
                            >
                                Go to Seller Dashboard
                                <ChevronRight />
                            </Link>
                        )}

                        {/* Logout */}
                        <button
                            className="account-logout"
                            type="button"
                            onClick={handleLogout}
                        >
                            <LogOut size={19} />
                            Logout
                        </button>

                    </aside>
                </div>
            )}
        </>
    );
}

