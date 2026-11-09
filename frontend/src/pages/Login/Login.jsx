
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import "./Login.css";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await API.post("/auth/login", {
                email,
                password
            });

            const { token, user } = response.data;

            // Save JWT token
            localStorage.setItem("token", token);

            // Save logged-in user information
            localStorage.setItem("user", JSON.stringify(user));

            // Notify Navbar that login has happened
            window.dispatchEvent(new Event("authChanged"));

            // Redirect based on account role
            if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else if (
                user.role === "seller" ||
                user.role === "customer"
            ) {
                navigate("/");
            } else {
                setError("Invalid user role");

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                window.dispatchEvent(new Event("authChanged"));
            }

        } catch (err) {
            console.log("Login error:", err.response?.data || err);

            setError(
                err.response?.data?.message ||
                "Invalid email or password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <form onSubmit={handleLogin} className="admin-login-form">

                <p className="admin-label">WELCOME TO SHOPZONE</p>

                <h1>Login</h1>

                <p>Sign in to continue shopping or manage your store.</p>

                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && (
                    <p className="admin-error">{error}</p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Login"}
                </button>

                <p className="login-register-link">
                    Don't have an account?{" "}
                    <Link to="/register">Create account</Link>
                </p>

            </form>
        </div>
    );
}
