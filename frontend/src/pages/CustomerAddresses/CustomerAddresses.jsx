
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./CustomerAddresses.css";

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
    isDefault: false
};

export default function CustomerAddresses() {
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState([]);
    const [form, setForm] = useState(emptyAddress);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/customer/addresses");

            const data = response.data.addresses || response.data;
            setAddresses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log(err.response?.data || err);
            setError(
                err.response?.data?.message ||
                "Unable to load addresses"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const openAddForm = () => {
        setForm(emptyAddress);
        setEditingId(null);
        setError("");
        setShowForm(true);
    };

    const openEditForm = (address) => {
        setForm({
            fullName: address.fullName || "",
            phone: address.phone || "",
            house: address.house || "",
            street: address.street || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            landmark: address.landmark || "",
            addressType: address.addressType || "Home",
            isDefault: address.isDefault || false
        });

        setEditingId(address._id);
        setError("");
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            if (editingId) {
                await API.put(
                    `/customer/addresses/${editingId}`,
                    form
                );
            } else {
                await API.post("/customer/addresses", form);
            }

            setShowForm(false);
            setForm(emptyAddress);
            setEditingId(null);

            await fetchAddresses();
        } catch (err) {
            console.log(err.response?.data || err);
            setError(
                err.response?.data?.message ||
                "Unable to save address"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (addressId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this address?"
        );

        if (!confirmed) return;

        try {
            setError("");
            await API.delete(`/customer/addresses/${addressId}`);
            await fetchAddresses();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete address"
            );
        }
    };

    if (loading) {
        return <div className="address-message">Loading addresses...</div>;
    }

    return (
        <div className="customer-address-page">
            <div className="address-container">

                <button
                    className="address-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>

                <div className="address-heading">
                    <div>
                        <p className="address-label">MY ACCOUNT</p>
                        <h1>My Addresses</h1>
                        <p>Manage your delivery addresses.</p>
                    </div>

                    {!showForm && (
                        <button
                            className="add-address-btn"
                            onClick={openAddForm}
                        >
                            + Add New Address
                        </button>
                    )}
                </div>

                {error && (
                    <p className="address-error">{error}</p>
                )}

                {showForm && (
                    <form
                        className="address-form"
                        onSubmit={handleSubmit}
                    >
                        <h2>
                            {editingId ? "Edit Address" : "Add New Address"}
                        </h2>

                        <div className="address-form-grid">

                            <input
                                name="fullName"
                                placeholder="Full Name"
                                value={form.fullName}
                                onChange={handleChange}
                                required
                            />

                            <input
                                name="phone"
                                type="tel"
                                placeholder="Phone Number"
                                value={form.phone}
                                onChange={handleChange}
                                required
                            />

                            <input
                                name="house"
                                placeholder="House / Building"
                                value={form.house}
                                onChange={handleChange}
                                required
                            />

                            <input
                                name="street"
                                placeholder="Street / Area"
                                value={form.street}
                                onChange={handleChange}
                                required
                            />

                            <input
                                name="city"
                                placeholder="City"
                                value={form.city}
                                onChange={handleChange}
                                required
                            />

                            <input
                                name="state"
                                placeholder="State"
                                value={form.state}
                                onChange={handleChange}
                                required
                            />

                            <input
                                name="pincode"
                                placeholder="PIN Code"
                                value={form.pincode}
                                onChange={handleChange}
                                required
                            />

                            <input
                                name="landmark"
                                placeholder="Landmark (Optional)"
                                value={form.landmark}
                                onChange={handleChange}
                            />

                            <select
                                name="addressType"
                                value={form.addressType}
                                onChange={handleChange}
                            >
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Other">Other</option>
                            </select>

                        </div>

                        <label className="default-address-option">
                            <input
                                type="checkbox"
                                name="isDefault"
                                checked={form.isDefault}
                                onChange={handleChange}
                            />
                            Set as default address
                        </label>

                        <div className="address-form-actions">
                            <button
                                type="submit"
                                disabled={saving}
                                className="save-address-btn"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Address"
                                        : "Save Address"}
                            </button>

                            <button
                                type="button"
                                className="cancel-address-btn"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                    setForm(emptyAddress);
                                    setError("");
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {!showForm && addresses.length === 0 && (
                    <div className="empty-address">
                        <h2>No addresses saved yet</h2>
                        <p>Add your first delivery address to get started.</p>
                        <button onClick={openAddForm}>
                            Add Your First Address
                        </button>
                    </div>
                )}

                {!showForm && addresses.length > 0 && (
                    <div className="address-grid">
                        {addresses.map((address) => (
                            <div
                                className="address-card"
                                key={address._id}
                            >
                                <div className="address-card-top">
                                    <span className="address-type">
                                        {address.addressType}
                                    </span>

                                    {address.isDefault && (
                                        <span className="default-badge">
                                            DEFAULT
                                        </span>
                                    )}
                                </div>

                                <h3>{address.fullName}</h3>

                                <p>
                                    {address.house}, {address.street}
                                </p>

                                {address.landmark && (
                                    <p>{address.landmark}</p>
                                )}

                                <p>
                                    {address.city}, {address.state} - {address.pincode}
                                </p>

                                <p>Phone: {address.phone}</p>

                                <div className="address-card-actions">
                                    <button
                                        onClick={() => openEditForm(address)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-address-btn"
                                        onClick={() => handleDelete(address._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
