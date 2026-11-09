
import { useState } from "react";
import API from "../../api/axios";
import "./AddProduct.css";

export default function AddProduct() {
    const [product, setProduct] = useState({
        name: "",
        desc: "",
        price: "",
        imageUrl: "",
        category: "",
        stock: ""
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProduct({
            ...product,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");

            const response = await API.post("/products", {
                ...product,
                price: Number(product.price),
                stock: Number(product.stock)
            });

            setMessage(response.data.message || "Product added successfully!");

            setProduct({
                name: "",
                desc: "",
                price: "",
                imageUrl: "",
                category: "",
                stock: ""
            });

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to add product. Please login as admin."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-product-page">
            <form className="add-product-form" onSubmit={handleSubmit}>
                <h2>Add New Product</h2>

                <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={product.name}
                    onChange={handleChange}
                    required
                />

                <textarea
                    name="desc"
                    placeholder="Product Description"
                    value={product.desc}
                    onChange={handleChange}
                    required
                />

                <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={product.price}
                    onChange={handleChange}
                    min="0"
                    required
                />

                <input
                    type="text"
                    name="imageUrl"
                    placeholder="Product Image URL"
                    value={product.imageUrl}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    value={product.category}
                    onChange={handleChange}
                    required
                />

                <input
                    type="number"
                    name="stock"
                    placeholder="Stock Quantity"
                    value={product.stock}
                    onChange={handleChange}
                    min="0"
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Product"}
                </button>

                {message && <p>{message}</p>}
            </form>
        </div>
    );
}
