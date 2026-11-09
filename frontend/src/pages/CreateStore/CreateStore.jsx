
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./CreateStore.css";

export default function CreateStore() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        storeName: "",
        description: "",
        phone: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

console.log("Stored token:", token ? "TOKEN EXISTS" : "TOKEN MISSING");

const response = await API.post("/stores/create", form);

            // Update saved user role after successful store creation
            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            alert("Your store has been created successfully!");

            navigate("/", { replace: true });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create your store"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-store-page">
            <div className="create-store-card">

                <span className="create-store-tag">
                    SHOPZONE SELLER
                </span>

                <h1>Create your own store</h1>

                <p>
                    Start your business with ShopZone and reach more customers.
                </p>

                <form onSubmit={handleSubmit}>

                    <label>Store name</label>
                    <input
                        type="text"
                        name="storeName"
                        placeholder="Enter your store name"
                        value={form.storeName}
                        onChange={handleChange}
                        required
                    />

                    <label>Store description</label>
                    <textarea
                        name="description"
                        placeholder="Tell customers about your store"
                        value={form.description}
                        onChange={handleChange}
                    />

                    <label>Phone number</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Enter store phone number"
                        value={form.phone}
                        onChange={handleChange}
                    />

                    {error && (
                        <p className="create-store-error">{error}</p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create my store"}
                    </button>

                </form>

            </div>
        </div>
    );
}

