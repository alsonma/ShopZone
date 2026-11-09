
import { useEffect, useState } from "react";
import API from "../../api/axios";
import "./CustomerProfile.css";
import { useNavigate } from "react-router-dom";

export default function CustomerProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch customer profile
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);

            const response = await API.get("/customer/profile");
            const user = response.data.user || response.data;

            setProfile(user);
            setName(user.name || "");
            setEmail(user.email || "");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your profile"
            );
        } finally {
            setLoading(false);
        }
    };

    // Update customer profile
    const handleUpdate = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await API.put("/customer/profile", {
                name,
                email
            });

            const updatedUser = response.data.user || response.data;

            setProfile(updatedUser);
            setName(updatedUser.name);
            setEmail(updatedUser.email);

            // Update localStorage
            const storedUser = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            localStorage.setItem(
                "user",
                JSON.stringify({
                    ...storedUser,
                    ...updatedUser
                })
            );

            // Notify Navbar about updated user
            window.dispatchEvent(new Event("authChanged"));

            setEditing(false);
            setSuccess("Profile updated successfully!");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update profile"
            );
        } finally {
            setSaving(false);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        setName(profile.name);
        setEmail(profile.email);
        setEditing(false);
        setError("");
    };

    // Loading screen
    if (loading) {
        return (
            <div className="profile-message">
                Loading profile...
            </div>
        );
    }

    // Profile error
    if (!profile) {
        return (
            <div className="profile-message profile-error">
                {error || "Profile not found"}
            </div>
        );
    }

    return (
    <div className="customer-profile-page">

        {/* Back Button Outside the Card */}
        <button
            type="button"
            className="profile-back-btn"
            onClick={() => navigate("/customer/dashboard")}
        >
            ← Back to Dashboard
        </button>

        <div className="profile-card">

            <div className="profile-avatar">
                {profile.name?.charAt(0).toUpperCase()}
            </div>

            <p className="profile-label">MY ACCOUNT</p>

            <h1>Personal Information</h1>

                {/* Success Message */}
                {success && (
                    <p className="profile-success">
                        {success}
                    </p>
                )}

                {/* Error Message */}
                {error && (
                    <p className="profile-error">
                        {error}
                    </p>
                )}

                {!editing ? (
                    <>
                        <div className="profile-details">

                            <div className="profile-field">
                                <span>Full Name</span>
                                <h3>{profile.name}</h3>
                            </div>

                            <div className="profile-field">
                                <span>Email Address</span>
                                <h3>{profile.email}</h3>
                            </div>

                            <div className="profile-field">
                                <span>Account Type</span>
                                <h3>{profile.role}</h3>
                            </div>

                            <div className="profile-field">
                                <span>Member Since</span>
                                <h3>
                                    {profile.createdAt
                                        ? new Date(
                                            profile.createdAt
                                        ).toLocaleDateString()
                                        : "Not available"}
                                </h3>
                            </div>

                        </div>

                        {/* Edit Button */}
                        <button
                            className="profile-edit-btn"
                            onClick={() => {
                                setEditing(true);
                                setSuccess("");
                                setError("");
                            }}
                        >
                            Edit Profile
                        </button>
                    </>
                ) : (
                    <form
                        onSubmit={handleUpdate}
                        className="profile-edit-form"
                    >

                        <label>Full Name</label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                        />

                        <label>Email Address</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                        <div className="profile-actions">

                            <button
                                type="submit"
                                className="profile-save-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                className="profile-cancel-btn"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>
                )}

            </div>

        </div>
    );
}
