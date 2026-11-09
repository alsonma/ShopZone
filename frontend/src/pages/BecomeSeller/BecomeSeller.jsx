
import { useNavigate } from "react-router-dom";
import "./BecomeSeller.css";

export default function BecomeSeller() {
    const navigate = useNavigate();

    const handleStartSelling = () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
        } else {
            navigate("/create-store");
        }
    };

    return (
        <section className="become-seller-page">

            <div className="seller-hero">

                <div className="seller-content">
                    <span className="seller-tag">
                        <span className="seller-dot"></span>
                        SELL ON SHOPZONE
                    </span>

                    <h1>
                        Turn Your Passion
                        Into a <span>Business.</span>
                    </h1>

                    <p>
                        Have something amazing to sell?
                        Bring your products to ShopZone and reach
                        customers who are looking for exactly what
                        you offer. Create your own store, showcase
                        your products and grow your business with us.
                    </p>

                    <button
                        className="seller-cta"
                        onClick={handleStartSelling}
                    >
                        Start Selling Today
                        <span>↗</span>
                    </button>

                    <div className="seller-note">
                        Your business journey starts here.
                    </div>
                </div>

                <div className="seller-visual">
                    <div className="seller-circle"></div>

                    <div className="seller-card">
                        <div className="seller-card-top">
                            <span>YOUR STORE</span>
                            <span className="seller-live">
                                ● LIVE
                            </span>
                        </div>

                        <div className="seller-shopping-icon">
                            <span>✦</span>
                        </div>

                        <h3>Your Brand.</h3>
                        <h3 className="seller-gold-text">
                            Your Business.
                        </h3>

                        <p>
                            Everything starts with one store.
                        </p>

                        <div className="seller-card-bottom">
                            <span>SHOPZONE MARKETPLACE</span>
                            <span>↗</span>
                        </div>
                    </div>

                    <div className="seller-floating seller-float-one">
                        ✦ Grow your business
                    </div>

                    <div className="seller-floating seller-float-two">
                        Your store, your rules.
                    </div>
                </div>

            </div>

            <div className="seller-benefits">

                <div className="seller-section-heading">
                    <span>WHY SELL WITH US?</span>
                    <h2>Everything you need to grow.</h2>
                    <p>
                        Build your brand and manage your business
                        from one simple platform.
                    </p>
                </div>

                <div className="seller-benefit-grid">

                    <div className="seller-benefit-card">
                        <div className="benefit-icon">↗</div>
                        <h3>Reach More Customers</h3>
                        <p>
                            Showcase your products to customers
                            browsing the ShopZone marketplace.
                        </p>
                    </div>

                    <div className="seller-benefit-card">
                        <div className="benefit-icon">▣</div>
                        <h3>Your Own Store</h3>
                        <p>
                            Create your own store profile and
                            present your brand professionally.
                        </p>
                    </div>

                    <div className="seller-benefit-card">
                        <div className="benefit-icon">◇</div>
                        <h3>Manage Everything</h3>
                        <p>
                            Manage products, inventory and orders
                            through your seller dashboard.
                        </p>
                    </div>

                </div>

            </div>

            <div className="seller-bottom-cta">
                <h2>Ready to build something great?</h2>
                <p>
                    Take the first step towards growing your business
                    with ShopZone.
                </p>

                <button onClick={handleStartSelling}>
                    Create Your Store <span>↗</span>
                </button>
            </div>

        </section>
    );
}
