import React, { useState, useEffect } from "react";
import ParkingLot from "../components/ParkingLot";
import { useNavigate } from "react-router-dom";
import { Clock, Lock, Unlock, Settings, ArrowRight } from "lucide-react";
import "../styles/Dashboard.css";
import TimeConfigModal from "../components/TimeConfigModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || {});
  const isAdmin = user.is_admin === true;
  const [fireStats, setFireStats] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const [currentTime, setCurrentTime] = useState(new Date());

  // Lấy cấu hình từ localStorage hoặc dùng mặc định
  const [openingTime, setOpeningTime] = useState(() => localStorage.getItem("openingTime") || "06:00");
  const [closingTime, setClosingTime] = useState(() => localStorage.getItem("closingTime") || "23:00");

  const [isOpen, setIsOpen] = useState(true);
  const [showTimeSetter, setShowTimeSetter] = useState(false);
  const [isAllDayClosed, setIsAllDayClosed] = useState(() => localStorage.getItem("isAllDayClosed") === "true")

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (isAllDayClosed) {
        setIsOpen(false);
        return;
      }

      const currentHMs = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = openingTime.split(":").map(Number);
      const [closeH, closeM] = closingTime.split(":").map(Number);

      setIsOpen(currentHMs >= (openH * 60 + openM) && currentHMs < (closeH * 60 + closeM));
    }, 1000);
    return () => clearInterval(timer);
  }, [openingTime, closingTime, isAllDayClosed]);

  const handleSaveConfig = (open, close, closed) => {
    setOpeningTime(open);
    setClosingTime(close);
    setIsAllDayClosed(closed);
    localStorage.setItem("openingTime", open);
    localStorage.setItem("closingTime", close);
    localStorage.setItem("isAllDayClosed", closed);
    setShowTimeSetter(false);
  };


  const fetchFireData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fire-warning/statistics`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const result = await res.json();
      if (res.ok) setFireStats(result.data);
    } catch (error) {
      console.error("Lỗi lấy thống kê hỏa hoạn:", error);
    }
  };

  useEffect(() => {
    fetchFireData();
    const interval = setInterval(fetchFireData, 5000); // Check hỏa hoạn mỗi 5 giây
    return () => clearInterval(interval);
  }, []);


  const handleLogout = async () => {
    const token = localStorage.getItem("token");

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

      {fireStats?.activeWarnings > 0 && (
        <div className="emergency-banner">
          PHÁT HIỆN HỎA HOẠN TẠI {fireStats.activeWarnings} VỊ TRÍ!
          <span> Nhiệt độ cao nhất: {fireStats.maxTemperature}°C</span>
        </div>
      )}
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Smart Parking Dashboard</h1>
          <p>Giám sát bãi đỗ xe thông minh (IoT)</p>
        </div>

        <div className="header-right-section">
          <div className="status-widget-v2">
            {/* Đồng hồ chính */}
            <div className="digital-clock">
              {currentTime.toLocaleTimeString("vi-VN", { hour12: false })}
            </div>

            <div className="divider-vertical" />

            {/* Hiển thị giờ hoạt động */}
            <div className="operation-hours">
              <div className="hour-tag">
                <span className="label">MỞ:</span> {openingTime}
              </div>
              <ArrowRight size={12} className="text-gray" />
              <div className="hour-tag">
                <span className="label">ĐÓNG:</span> {closingTime}
              </div>
            </div>

            {/* Badge Trạng thái */}
            <div className={`status-badge ${isOpen ? "is-open" : "is-closed"}`}>
              {isOpen ? <Unlock size={14} /> : <Lock size={14} />}
              {isOpen ? "OPEN" : "CLOSED"}
            </div>

            {/* Nút cài đặt cho Admin */}
            {isAdmin && (
              <div className="admin-controls">
                <button className="settings-trigger" onClick={() => setShowTimeSetter(!showTimeSetter)}>
                  <Settings size={18} />
                </button>

                <TimeConfigModal
                  isOpen={showTimeSetter}
                  onClose={() => setShowTimeSetter(false)}
                  openingTime={openingTime}
                  closingTime={closingTime}
                  isAllDayClosed={isAllDayClosed}
                  onSave={handleSaveConfig}
                />
              </div>
            )}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </header>

      <main className="dashboard-main">
        <ParkingLot
          isAdmin={isAdmin} />
      </main>

      <footer className="dashboard-footer">
        <p>© 2025 Smart Parking System — Powered by ESP32 & React</p>
      </footer>
    </div>
  );
};

export default Dashboard;