
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public pages
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import BecomeSeller from "./pages/BecomeSeller/BecomeSeller";
import CustomerProfile from "./pages/CustomerPofile/CustomerProfile";
import CustomerAddresses from "./pages/CustomerAddresses/CustomerAddresses";
import CustomerOrders from "./pages/CustomerOrders/CustomerOrders";
import SellerDashboard from "./pages/SellerDashboard/SellerDashboard";
import Checkout from "./pages/Checkout/Checkout";
import Cart from "./pages/Cart/Cart";
import MyOrders from "./pages/MyOrders/MyOrders";
import Payment from "./pages/Payment/Payment";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import Wishlist from "./pages/Wishlist/Wishlist";
import SearchResults from "./pages/SearchResults/SearchResults";
// Seller pages
import CreateStore from "./pages/CreateStore/CreateStore";
// Admin pages
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public pages */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/become-seller" element={<BecomeSeller />} />
                <Route path="/customer/addresses" element={<CustomerAddresses />}/>
                <Route path="/customer/orders" element={<CustomerOrders />} />
                <Route path="/customer/profile" element={<CustomerProfile />} />
                <Route path="/seller/dashboard" element={<SellerDashboard />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/search" element={<SearchResults />} />

                {/* Seller pages */}
                <Route path="/create-store" element={<CreateStore />} />
                {/* Admin pages */}
                <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
                {/* Unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
