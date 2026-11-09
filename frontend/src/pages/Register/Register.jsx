
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import "./Register.css";

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
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

            const response = await API.post("/auth/register", form);

            alert(response.data.message || "Registration successful!");

            navigate("/login");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">

                <Link to="/" className="register-brand">
                    Shop<span>Zone</span>.
                </Link>

                <p className="register-tag">WELCOME TO SHOPZONE</p>

                <h1>Create your account</h1>

                <p className="register-subtitle">
                    Join ShopZone and discover products you'll love.
                </p>

                <form onSubmit={handleSubmit}>

                    <label>Full name</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />

                    <label>Email address</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                    />

                    {error && (
                        <p className="register-error">{error}</p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                </form>

                <p className="register-login">
                    Already have an account?
                    {" "}
                    <Link to="/login">Login</Link>
                </p>

            </div>
        </div>
    );
}
