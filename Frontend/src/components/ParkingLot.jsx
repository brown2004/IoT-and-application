import React, { useEffect, useState } from "react";
import ParkingSlot from "./ParkingSlot";
import { fetchParkingData } from "../api";
import "../styles/ParkingLot.css";
import SelectedSlotPanel from "./SelectedSlotPanel";
import ExitConfirmPopup from "./ExitConfirmPopup";
import Notification from "./Notification";

const ParkingLot = () => {
  const [slots, setSlots] = useState([]);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyType, setNotifyType] = useState("info");

  // Đổi từ Number sang String vì MongoDB ID là chuỗi
  const [selectedSlot, setSelectedSlot] = useState(() => {
    return sessionStorage.getItem("mySlot") || null;
  });

  const fullSelectedSlot = slots.find(s => s._id === selectedSlot);

  const [exitPopup, setExitPopup] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchParkingData();
      setSlots(data);

      if (selectedSlot) {
        // Tìm slot bằng _id từ backend
        const mySlot = data.find((s) => s._id === selectedSlot);

        // Nếu bạn đang đánh dấu chỗ đó mà trạng thái chuyển sang 'available' (hoặc 'inactive')
        // nghĩa là xe đã rời bãi thực tế (ESP32 cập nhật lên server)
        if (mySlot && mySlot.status === "available") {
          setExitPopup(true);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000); // 3s cập nhật 1 lần
    return () => clearInterval(interval);
  }, [selectedSlot]);

  const handleSelectSlot = (slot) => {
    if (selectedSlot !== null && selectedSlot !== slot._id) {
      setNotifyMessage("Bạn đã chọn chỗ để xe rồi! Vui lòng bỏ đánh dấu trước");
      setNotifyType("error");
      return;
    }

    // Logic: Chỉ cho phép đánh dấu vào ô đang có xe (occupied)
    if (slot.status === "available") {
      setNotifyMessage("Đây là ô trống — không phải xe của bạn!");
      setNotifyType("info");
      return;
    }

    sessionStorage.setItem("mySlot", slot._id);
    setSelectedSlot(slot._id);
    setNotifyMessage(`Đã đánh dấu chỗ: ${slot.name || slot._id}`);
    setNotifyType("info");
  };

  const handleNotMe = () => {
    //alert("CẢNH BÁO! Xe của bạn đã bị lấy trái phép!");
    setNotifyMessage("CẢNH BÁO! Xe của bạn đã bị lấy trái phép!");
    setNotifyType("warning");
    setExitPopup(false);
  };

  const handleConfirmExit = () => {
    //alert("Xe của bạn đã rời khỏi bãi!");
    setNotifyMessage("Xe của bạn đã rời khỏi bãi!");
    setNotifyType("info");
    sessionStorage.removeItem("mySlot");
    setSelectedSlot(null);
    setExitPopup(false);
  };

  const total = slots.length;
  const occupied = slots.filter((s) => s.status === "occupied").length;
  const available = total - occupied;

  return (
    <div className="parking-lot">
      <div className="lot-stats">
        <div className="stat-card total">
          <h3>Tổng chỗ</h3>
          <p>{total}</p>
        </div>
        <div className="stat-card occupied">
          <h3>Đang có xe</h3>
          <p>{occupied}</p>
        </div>
        <div className="stat-card available">
          <h3>Trống</h3>
          <p>{available}</p>
        </div>
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
        onClear={() => {
          setSelectedSlot(null);
          sessionStorage.removeItem("mySlot");
        }} />

      {exitPopup && (
        <ExitConfirmPopup
          slot={selectedSlot}
          onYes={handleConfirmExit}
          onNo={handleNotMe}
        />
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
