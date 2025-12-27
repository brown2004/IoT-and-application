import React from "react";
import ParkingLot from "../components/ParkingLot";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/logoutAll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Gửi token lên để auth middleware xác thực
        },
      });

      if (res.ok) {
        console.log("Đã đăng xuất khỏi tất cả thiết bị");
      } else {
        console.error("Lỗi server khi logout");
      }
    } catch (error) {
      console.error("Không thể kết nối API logout:", error);
    } finally {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("token");
      navigate("/");
      window.location.reload(); 
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Smart Parking Dashboard</h1>
          <p>Giám sát bãi đỗ xe thông minh (IoT)</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </header>

      <main className="dashboard-main">
        <ParkingLot />
      </main>
      
      <footer className="dashboard-footer">
        <p>© 2025 Smart Parking System — Powered by ESP32 & React</p>
      </footer>
    </div>
  );
};

export default Dashboard;