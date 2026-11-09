
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./Checkout.css";

const emptyAddress = {
  fullName: "",
  phone: "",
  house: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  addressType: "Home",
};

export default function Checkout() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [addingAddress, setAddingAddress] = useState(false);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [cartResponse, addressResponse] = await Promise.all([
          API.get("/cart"),
          API.get("/customer/addresses"),
        ]);

        const cartItems = cartResponse.data.cart?.items || [];
        const savedAddresses = addressResponse.data.addresses || [];

        setItems(cartItems);
        setAddresses(savedAddresses);

        if (savedAddresses.length > 0) {
          const defaultAddress =
            savedAddresses.find((address) => address.isDefault) ||
            savedAddresses[0];

          setSelectedAddressId(defaultAddress._id);
          setAddingAddress(false);
        } else {
          setAddingAddress(true);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load checkout information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, []);

  const subtotal = items.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setNewAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save/select address and continue to the payment page.
  const handleContinueToPayment = async (e) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setPlacingOrder(true);

      let shippingDetails;

      if (addingAddress) {
        const addressResponse = await API.post(
          "/customer/addresses",
          {
            ...newAddress,
            isDefault: addresses.length === 0,
          }
        );

        const savedAddresses =
          addressResponse.data.addresses || [];

        setAddresses(savedAddresses);

        // Find the newly saved address.
        const savedAddress =
          savedAddresses.find(
            (address) =>
              address.fullName === newAddress.fullName &&
              address.phone === newAddress.phone &&
              address.house === newAddress.house &&
              address.pincode === newAddress.pincode
          ) || savedAddresses[savedAddresses.length - 1];

        if (!savedAddress) {
          throw new Error("Address could not be saved.");
        }

        setSelectedAddressId(savedAddress._id);
        shippingDetails = savedAddress;
      } else {
        shippingDetails = addresses.find(
          (address) => address._id === selectedAddressId
        );

        if (!shippingDetails) {
          throw new Error("Please select a shipping address.");
        }
      }

      const orderAddress = {
        fullName: shippingDetails.fullName,
        phone: shippingDetails.phone,
        address: [
          shippingDetails.house,
          shippingDetails.street,
          shippingDetails.landmark,
          shippingDetails.state,
        ]
          .filter(Boolean)
          .join(", "),
        city: shippingDetails.city,
        postalCode: shippingDetails.pincode,
      };

      // Save checkout information temporarily for the Payment page.
      sessionStorage.setItem(
        "shopzoneCheckout",
        JSON.stringify({
          items,
          shippingAddress: orderAddress,
          totalAmount: subtotal,
        })
      );

      navigate("/payment");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to continue to payment."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        Loading checkout...
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button type="button" onClick={() => navigate("/cart")}>
          ← Back to Cart
        </button>

        <h1>Checkout</h1>
        <p>Complete your delivery details to continue.</p>
      </div>

      {error && (
        <div className="checkout-error">{error}</div>
      )}

      <div className="checkout-layout">
        <form
          className="shipping-form"
          onSubmit={handleContinueToPayment}
        >
          <h2>Shipping Address</h2>

          {!addingAddress && addresses.length > 0 && (
            <div className="saved-addresses">
              {addresses.map((address) => (
                <label
                  className={`saved-address-card ${
                    selectedAddressId === address._id
                      ? "selected"
                      : ""
                  }`}
                  key={address._id}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    value={address._id}
                    checked={selectedAddressId === address._id}
                    onChange={() =>
                      setSelectedAddressId(address._id)
                    }
                  />

                  <div className="saved-address-details">
                    <div className="saved-address-heading">
                      <strong>{address.fullName}</strong>
                      <span>{address.addressType}</span>
                      {address.isDefault && (
                        <small>Default</small>
                      )}
                    </div>

                    <p>{address.phone}</p>
                    <p>
                      {address.house}, {address.street}
                    </p>

                    {address.landmark && (
                      <p>{address.landmark}</p>
                    )}

                    <p>
                      {address.city}, {address.state} -{" "}
                      {address.pincode}
                    </p>
                  </div>
                </label>
              ))}

              <button
                type="button"
                className="add-new-address-btn"
                onClick={() => {
                  setNewAddress(emptyAddress);
                  setAddingAddress(true);
                }}
              >
                + Add a New Address
              </button>
            </div>
          )}

          {addingAddress && (
            <div className="new-address-form">
              <div className="address-form-heading">
                <h3>
                  {addresses.length > 0
                    ? "New Address"
                    : "Enter Your Address"}
                </h3>

                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAddingAddress(false)}
                  >
                    Choose Saved Address
                  </button>
                )}
              </div>

              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={newAddress.fullName}
                onChange={handleAddressChange}
                required
              />

              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={newAddress.phone}
                onChange={handleAddressChange}
                required
              />

              <label>House / Flat / Building</label>
              <input
                type="text"
                name="house"
                value={newAddress.house}
                onChange={handleAddressChange}
                required
              />

              <label>Street / Area</label>
              <input
                type="text"
                name="street"
                value={newAddress.street}
                onChange={handleAddressChange}
                required
              />

              <label>Landmark (Optional)</label>
              <input
                type="text"
                name="landmark"
                value={newAddress.landmark}
                onChange={handleAddressChange}
              />

              <div className="checkout-input-row">
                <div>
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={newAddress.city}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <div>
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={newAddress.state}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
              </div>

              <div className="checkout-input-row">
                <div>
                  <label>PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={newAddress.pincode}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <div>
                  <label>Address Type</label>
                  <select
                    name="addressType"
                    value={newAddress.addressType}
                    onChange={handleAddressChange}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="place-order-btn"
            disabled={
              placingOrder ||
              items.length === 0 ||
              (!addingAddress && !selectedAddressId)
            }
          >
            {placingOrder
              ? "Saving Details..."
              : "Continue to Payment →"}
          </button>
        </form>

        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {items.map((item) => (
            <div
              className="checkout-item"
              key={item.product._id}
            >
              <div>
                <h4>{item.product.name}</h4>
                <p>Quantity: {item.quantity}</p>
              </div>

              <strong>
                ₹
                {(item.product.price * item.quantity).toFixed(2)}
              </strong>
            </div>
          ))}

          <div className="checkout-total">
            <span>Total</span>
            <strong>₹{subtotal.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
