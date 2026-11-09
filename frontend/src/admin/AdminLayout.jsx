
import { Navigate, Outlet } from "react-router-dom";

export default function AdminLayout() {
    const token = localStorage.getItem("token");

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch {
        user = null;
    }

    if (!token || user?.role !== "admin") {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}
