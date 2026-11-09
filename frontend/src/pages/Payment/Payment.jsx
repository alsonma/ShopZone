
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./Payment.css";

export default function Payment() {
  const navigate = useNavigate();

  const [checkout, setCheckout] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedCheckout = sessionStorage.getItem("shopzoneCheckout");

      if (!savedCheckout) {
        navigate("/checkout", { replace: true });
        return;
      }

      setCheckout(JSON.parse(savedCheckout));
    } catch {
      sessionStorage.removeItem("shopzoneCheckout");
      navigate("/checkout", { replace: true });
    }
  }, [navigate]);

  const handleDemoPayment = async () => {
    if (!checkout || processing) return;

    try {
      setProcessing(true);
      setError("");

      // Create the order using your existing backend API.
      await API.post("/orders", {
        shippingAddress: checkout.shippingAddress,
      });

      // Clear temporary checkout information.
      sessionStorage.removeItem("shopzoneCheckout");

      // Update navbar cart count.
      window.dispatchEvent(new Event("cartUpdated"));

      // Navigate to order history.
      navigate("/my-orders", {
        replace: true,
        state: {
          successMessage:
            "Demo payment successful! Your order has been confirmed.",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to confirm your demo order."
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!checkout) {
    return <div className="payment-loading">Loading payment...</div>;
  }

  const { items, shippingAddress, totalAmount } = checkout;

  const paymentOptions = [
    {
      id: "upi",
      title: "UPI",
      description: "Google Pay, PhonePe, Paytm and more",
      icon: "◈",
    },
    {
      id: "card",
      title: "Credit / Debit Card",
      description: "Visa, Mastercard and RuPay",
      icon: "▣",
    },
    {
      id: "netbanking",
      title: "Net Banking",
      description: "Pay directly through your bank",
      icon: "▤",
    },
  ];

  return (
    <div className="payment-page">
      <div className="payment-header">
        <button onClick={() => navigate("/checkout")}>
          ← Back to Checkout
        </button>

        <h1>Payment</h1>
        <p>Review your order and select a payment method.</p>
      </div>

      {error && <div className="checkout-error">{error}</div>}

      <div className="payment-layout">
        <div className="payment-main">
          <section className="payment-section">
            <h2>Delivery Address</h2>

            <div className="payment-address">
              <strong>{shippingAddress.fullName}</strong>
              <p>{shippingAddress.phone}</p>
              <p>{shippingAddress.address}</p>
              <p>
                {shippingAddress.city} - {shippingAddress.postalCode}
              </p>
            </div>
          </section>

          <section className="payment-section">
            <h2>Select Payment Method</h2>

            <div className="payment-options">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={`payment-option ${
                    paymentMethod === option.id ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.id}
                    checked={paymentMethod === option.id}
                    onChange={() => setPaymentMethod(option.id)}
                  />

                  <span className="payment-option-icon">
                    {option.icon}
                  </span>

                  <span className="payment-option-details">
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="payment-notice">
            Demo payment mode: no real money will be charged.
            Clicking the button will create a test order.
          </div>

          <button
            type="button"
            className="payment-submit-btn"
            onClick={handleDemoPayment}
            disabled={processing}
          >
            {processing
              ? "Confirming Order..."
              : `Demo Confirm Order · ₹${Number(totalAmount).toFixed(2)}`}
          </button>

          <p className="payment-secure-note">
            This is a simulated payment for development and testing only.
          </p>
        </div>

        <aside className="payment-summary">
          <h2>Order Summary</h2>

          {items.map((item, index) => {
            const product = item.product || {};

            return (
              <div
                className="payment-product"
                key={product._id || index}
              >
                <div>
                  <strong>{product.name || "Product"}</strong>
                  <p>Quantity: {item.quantity}</p>
                </div>

                <strong>
                  ₹{(
                    Number(product.price || 0) * item.quantity
                  ).toFixed(2)}
                </strong>
              </div>
            );
          })}

          <div className="payment-total">
            <span>Total Amount</span>
            <strong>₹{Number(totalAmount).toFixed(2)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
