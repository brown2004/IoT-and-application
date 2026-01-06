import React, { useEffect, useState } from "react";
import ParkingSlot from "./ParkingSlot";
import { fetchParkingData } from "../api";
import "../styles/ParkingLot.css";
import SelectedSlotPanel from "./SelectedSlotPanel";
import { io } from "socket.io-client";
import ExitConfirmPopup from "./ExitConfirmPopup";
import Notification from "./Notification";
import { ShieldAlert, CheckCircle, Clock, User, Flame, AlertTriangle } from "lucide-react";

const ParkingLot = ({ isAdmin }) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const [slots, setSlots] = useState([]);

  // State quản lý socket
  const [socket, setSocket] = useState(null);

  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyType, setNotifyType] = useState("info");

  // Lấy dữ liệu từ sessionStorage để không mất trạng thái khi F5 trang
  const [selectedSlot, setSelectedSlot] = useState(() => sessionStorage.getItem("mySlot") || null);
  const [currentTicketId, setCurrentTicketId] = useState(() => sessionStorage.getItem("myTicketId") || null);
  const [exitPopup, setExitPopup] = useState(false);

  const [hasShownExitPopup, setHasShownExitPopup] = useState(() =>
    sessionStorage.getItem("hasShownExitPopup") === "true"
  );
  const fullSelectedSlot = slots.find(s => s._id === selectedSlot);

  const [fireWarnings, setFireWarnings] = useState([]);
  const [securityWarnings, setSecurityWarnings] = useState([]);
  const [isFireEmergency, setIsFireEmergency] = useState(false);

  const [paymentData, setPaymentData] = useState(null); // Lưu thông tin hóa đơn
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Hiện/ẩn bảng thanh toán

  const [confirmSlotPopup, setConfirmSlotPopup] = useState(false); // Trạng thái ẩn/hiện popup
  const [pendingSlot, setPendingSlot] = useState(null);

  console.log("token là:", localStorage.getItem("token"));

  // 1. Tự động theo dõi trạng thái ô đỗ từ cảm biến
  useEffect(() => {
    console.log("Khởi tạo socket tới:", API_BASE_URL);
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);
    newSocket.on('connect', () => {
      console.log("KẾT NỐI SOCKET THÀNH CÔNG, ID:", newSocket.id);
    });

    // Lần đầu vào vẫn load data tổng thể
    const initLoad = async () => {
      const data = await fetchParkingData();
      setSlots(data);
    };
    initLoad();

    // Cập nhật trạng thái ô đỗ (Xe vào/ra)
    newSocket.on('parking_update', (updatedSlot) => {
      console.log("Cập nhật ô đỗ:", updatedSlot);
      setSlots(prevSlots => prevSlots.map(slot =>
        slot._id === updatedSlot._id ? updatedSlot : slot
      ));

      // Kiểm tra nếu ô đỗ của CHÍNH MÌNH vừa trống (xe đã rời đi)
      if (updatedSlot._id === selectedSlot && updatedSlot.status === 'Free') {
        if (!hasShownExitPopup) {
          setExitPopup(true);
          setHasShownExitPopup(true);
        }
      }
    });

    // Cảnh báo cháy khẩn cấp (Real-time từ MQTT)
    // Gộp 2 cái fire_sensor_update thành 1
    newSocket.on('fire_sensor_update', (data) => {
      console.log("Dữ liệu cảm biến nhận được:", data);

      // Chuẩn hóa dữ liệu: API Postman gửi sensor trực tiếp, MQTT gửi {sensor, message}
      const sensorData = data.sensor ? data.sensor : data;

      if (sensorData.status === 'warning') {
        setFireWarnings(prev => {
          const exists = prev.find(f => f._id === sensorData._id);
          if (exists) return prev.map(f => f._id === sensorData._id ? sensorData : f);
          return [...prev, sensorData];
        });
        setIsFireEmergency(true);
        setNotifyMessage(`CẢNH BÁO: Phát hiện nhiệt độ cao tại Tầng ${sensorData.location?.floor}`);
        setNotifyType("error");
      } else {
        // Nếu status là normal, xóa khỏi danh sách cảnh báo
        setFireWarnings(prev => {
          const newList = prev.filter(f => f._id !== sensorData._id);
          if (newList.length === 0) setIsFireEmergency(false);
          return newList;
        });
      }
    });

    // Cảnh báo an ninh (Khi khách hàng báo mất xe)
    // Backend emit sự kiện 'security_alert' cho admin
    newSocket.on('security_alert', (ticket) => {
      if (isAdmin) {
        setSecurityWarnings(prev => [...prev, ticket]);
        setNotifyMessage("CẢNH BÁO AN NINH MỚI!");
        setNotifyType("warning");
      }
    });

    newSocket.on('security_resolved', (data) => {
      setSecurityWarnings(prev => prev.filter(t => t._id !== data.ticketId));
      // Thông báo nhẹ để admin biết đồng nghiệp đã xử lý xong
      setNotifyMessage("Một cảnh báo an ninh đã được xử lý bởi Admin khác.");
      setNotifyType("info");
    });

    return () => newSocket.close();
  }, [API_BASE_URL, isAdmin, selectedSlot, hasShownExitPopup]);

  const handleAcknowledgeFire = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/fire-warning/warnings/${id}/acknowledge`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
    } catch (error) {
      console.error("Không thể tắt báo động");
    }
  };

  // 2. Hàm khi người dùng CHỦ ĐỘNG bấm chọn ô xe của mình
  const handleSelectSlot = (slot) => {
    if (selectedSlot !== null && selectedSlot !== slot._id) {
      setNotifyMessage("Bạn đã chọn một chỗ đỗ xe rồi!");
      setNotifyType("error");
      return;
    }

    if (slot.status === "Free") {
      setNotifyMessage("Ô này đang trống, hãy đỗ xe vào trước khi xác nhận!");
      setNotifyType("warning");
      return;
    }

    // Thay vì gọi API ngay, ta mở popup xác nhận
    setPendingSlot(slot);
    setConfirmSlotPopup(true);
  };

  const processSlotSelection = async () => {
    const slot = pendingSlot;
    if (!slot) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          userId: JSON.parse(localStorage.getItem("user"))._id,
          slotId: slot._id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const ticketId = result.data._id;
        sessionStorage.setItem("mySlot", slot._id);
        sessionStorage.setItem("myTicketId", ticketId);

        setHasShownExitPopup(false);
        setSelectedSlot(slot._id);
        setCurrentTicketId(ticketId);
        setNotifyMessage(`Xác nhận đỗ xe thành công tại ô: ${slot.name}`);
        setNotifyType("success");
      } else {
        setNotifyMessage(result.message || "Lỗi tạo vé xe");
        setNotifyType("error");
      }
    } catch (error) {
      setNotifyMessage("Lỗi kết nối server!");
      setNotifyType("error");
    } finally {
      setConfirmSlotPopup(false); // Đóng popup
      setPendingSlot(null);
    }
  };

  const handleConfirmExit = async () => {
    try {
      // Gọi API để tính tiền (nhưng chưa kết thúc ticket hoàn toàn hoặc gọi endpoint preview)
      const response = await fetch(`${API_BASE_URL}/api/tickets/calculate/${currentTicketId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      const result = await response.json();

      if (response.ok) {
        setPaymentData(result.data); // Lưu thông tin: giờ vào, giờ ra, tổng tiền
        setExitPopup(false);         // Đóng popup xác nhận rời bãi
        setShowPaymentModal(true);   // Mở bảng thanh toán
      }
    } catch (error) {
      setNotifyMessage("Lỗi tính toán hóa đơn!");
      setNotifyType("error");
    }
  };

  const handleFinalPayment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/checkout/${currentTicketId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.ok) {
        setNotifyMessage("Thanh toán thành công! Chúc bạn thượng lộ bình an.");
        setNotifyType("success");

        // Reset toàn bộ trạng thái
        sessionStorage.removeItem("mySlot");
        sessionStorage.removeItem("myTicketId");
        sessionStorage.removeItem("hasShownExitPopup");

        setSelectedSlot(null);
        setCurrentTicketId(null);
        setHasShownExitPopup(false); // Reset state
        setShowPaymentModal(false);
        setPaymentData(null);
      }
    } catch (error) {
      setNotifyMessage("Giao dịch thất bại!");
      setNotifyType("error");
    }
  };

  // 4. Hàm BÁO CÁO MẤT XE (Nút No trên Popup)
  const handleNotMe = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/report/${currentTicketId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.ok) {
        setNotifyMessage("CẢNH BÁO! Hệ thống đã ghi nhận xe bị lấy trái phép!");
        setNotifyType("warning");
      }
    } catch (error) {
      setNotifyMessage("Không thể gửi báo cáo khẩn cấp!");
    } finally {
      setExitPopup(false);
    }
  };

  // Thêm hàm này vào trong ParkingLot component
  const handleResolve = async (ticketId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/warnings/resolve/${ticketId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setNotifyMessage("Đã xác nhận xử lý vụ việc!");
        setNotifyType("success");
        // Cập nhật lại danh sách cảnh báo ngay lập tức để số lượng giảm xuống
        setSecurityWarnings(prev => prev.filter(t => t._id !== ticketId));
      }
    } catch (error) {
      setNotifyMessage("Lỗi khi xác nhận xử lý!");
      setNotifyType("error");
    }
  };

  return (
    <div className={`parking-lot ${isFireEmergency ? 'emergency-mode' : ''}`}>
      {isAdmin && fireWarnings.length > 0 && (
        <div className="fire-emergency-container">
          <div className="fire-panel-header">
            <Flame className="icon-fire-blink" size={32} />
            <div className="fire-title">
              <h2>CẢNH BÁO HỎA HOẠN KHẨN CẤP</h2>
              <span>Yêu cầu sơ tán và kiểm tra ngay lập tức!</span>
            </div>
          </div>

          <div className="fire-grid">
            {fireWarnings.map((fire) => (
              <div key={fire._id} className="fire-card">
                <div className="fire-card-content">
                  <div className="location-badge-red">
                    <AlertTriangle size={16} />
                    Tầng {fire.location?.floor} - {fire.location?.position}
                  </div>
                  <div className="fire-details">
                    <div className="detail-row">
                      <Clock size={16} />
                      <span>Phát hiện: {new Date(fire.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button className="btn-fire-resolve" onClick={() => handleAcknowledgeFire(fire._id)}>
                    <CheckCircle size={18} />
                    Tắt báo động
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- KHỐI AN NINH (Dùng ShieldAlert) --- */}
      {isAdmin && securityWarnings.length > 0 && (
        <div className="security-emergency-container">
          <div className="security-panel-header">
            <ShieldAlert className="icon-security-blink" size={28} />
            <div className="security-title">
              <h2>HỆ THỐNG CẢNH BÁO AN NINH</h2>
              <span className="warning-count">{securityWarnings.length} Vụ việc cần xử lý</span>
            </div>
          </div>

          <div className="security-grid">
            {securityWarnings.map((ticket) => (
              <div key={ticket._id} className="security-card">
                <div className="security-card-content">
                  <div className="slot-badge">
                    Tầng {ticket.slotId?.floor} - Vị trí {ticket.slotId?.row}-{ticket.slotId?.column}
                  </div>
                  <div className="security-details">
                    <div className="detail-row">
                      <User size={16} />
                      <span>Khách hàng: <strong>{ticket.userId?.username}</strong></span>
                    </div>
                    <div className="detail-row">
                      <Clock size={16} />
                      <span>Báo động: {new Date(ticket.updatedAt || Date.now()).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <button className="btn-resolve-action" onClick={() => handleResolve(ticket._id)}>
                  <CheckCircle size={18} />
                  Xác nhận xử lý
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="lot-stats">
        <div className="stat-card total"><h3>Tổng chỗ</h3><p>{slots.length}</p></div>
        <div className="stat-card Occupied"><h3>Đang có xe</h3><p>{slots.filter(s => s.status === 'Occupied').length}</p></div>
        <div className="stat-card Free"><h3>Trống</h3><p>{slots.filter(s => s.status === 'Free').length}</p></div>
      </div>

      <div className="slot-grid">
        {slots.map((slot) => (
          <ParkingSlot
            key={slot._id}
            id={slot._id}
            floor={slot.floor}
            row={slot.row}
            column={slot.column}
            status={slot.status}
            isSelected={selectedSlot === slot._id}
            onSelect={() => handleSelectSlot(slot)}
          />
        ))}
      </div>

      <SelectedSlotPanel
        slot={fullSelectedSlot}
        onClear={async () => {
          // Xử lý xóa vé nếu người dùng nhấn hủy chọn thủ công
          if (currentTicketId) {
            await fetch(`${API_BASE_URL}/api/tickets/${currentTicketId}/delete`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
          }
          setSelectedSlot(null);
          setCurrentTicketId(null);
          sessionStorage.removeItem("mySlot");
          sessionStorage.removeItem("myTicketId");
        }}
      />

      {exitPopup && (
        <ExitConfirmPopup
          slot={slots.find(s => s._id === selectedSlot)}
          onYes={handleConfirmExit}
          onNo={handleNotMe}
        />
      )}
      {/* Xác nhận vị trí popup */}
      {confirmSlotPopup && pendingSlot && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">
              <ShieldAlert size={48} color="#fbbf24" />
            </div>
            <h2>Xác nhận vị trí</h2>
            <p>Bạn đang xác nhận đỗ xe tại ô:</p>
            <div className="confirm-slot-info">
              <strong>Tầng {pendingSlot.floor}</strong><br></br>
              <strong>{pendingSlot.column} - {pendingSlot.row}</strong>
            </div>
            <p className="confirm-note">Vui lòng đảm bảo đây đúng là vị trí xe của bạn để tránh lỗi hệ thống.</p>

            <div className="confirm-actions">
              <button className="btn-confirm-yes" onClick={processSlotSelection}>
                Đúng, là xe của tôi
              </button>
              <button className="btn-confirm-no" onClick={() => setConfirmSlotPopup(false)}>
                Bấm nhầm, để tôi chọn lại
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && paymentData && (
        <div className="payment-overlay">
          <div className="payment-modal">
            <h2>Hóa Đơn Thanh Toán</h2>
            <div className="payment-info">
              <p><strong>Vị trí:</strong> {fullSelectedSlot?.name || 'P-' + selectedSlot.slice(-4)}</p>
              <p><strong>Giờ vào:</strong> {new Date(paymentData.startTime).toLocaleString()}</p>
              <p><strong>Giờ ra:</strong> {new Date().toLocaleString()}</p>
              <hr />
              <p className="total-price">
                <strong>Tổng tiền:</strong> <span>{paymentData.totalPrice.toLocaleString()} VNĐ</span>
              </p>
            </div>

            <div className="payment-actions">
              <button className="btn-confirm" onClick={handleFinalPayment}>
                Xác nhận thanh toán
              </button>
              <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <Notification
        message={notifyMessage}
        type={notifyType}
        onClose={() => setNotifyMessage("")}
      />
    </div>
  );
};

export default ParkingLot;