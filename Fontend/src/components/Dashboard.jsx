import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "120px" }}>
      <h1>🏙️ Smart Parking Dashboard</h1>
      <p>Xin chào, bạn đã đăng nhập thành công!</p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#1e3c72",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
};

export default Dashboard;
