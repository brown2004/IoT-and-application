import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  console.log("API URL là:", API_BASE_URL);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Khớp với route trong userRouter của bạn
    const endpoint = isRegistering ? "/api/users" : "/api/users/login";

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });

      const data = await res.json();

      if (res.status === 201 || res.status === 200) {
        if (isRegistering) {
          setMessage("Đăng ký thành công! Đang chuyển sang đăng nhập...");
          setTimeout(() => {
            setIsRegistering(false);
            setMessage("");
          }, 2000);
        } else {
          // Lưu token và user nhận được từ API vào localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("loggedIn", "true");

          navigate("/dashboard");
          window.location.reload();
        }
      } else {
        // Hiển thị lỗi từ backend nếu có
        setError(data.error || "Có lỗi xảy ra, vui lòng kiểm tra lại.");
      }
    } catch (err) {
      setError("Không thể kết nối tới server backend.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>{isRegistering ? "Đăng ký Smart Parking" : "Đăng nhập Smart Parking"}</h2>

        <input
          type="text"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          {isRegistering ? "Đăng ký" : "Đăng nhập"}
        </button>

        {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        {message && <p className="success-message" style={{ color: 'green', marginTop: '10px' }}>{message}</p>}

        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <span>{isRegistering ? "Đã có tài khoản?" : "Chưa có tài khoản?"}</span>
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isRegistering ? " Đăng nhập ngay" : " Đăng ký ngay"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;