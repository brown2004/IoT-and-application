import React from "react";
import { AlertTriangle, MapPin, CheckCircle2, XCircle } from "lucide-react"; 
import "../styles/ExitConfirmPopup.css";

const ExitConfirmPopup = ({ slot, onYes, onNo }) => {
  if (!slot) return null;
  console.log("Hiển thị popup xác nhận với slot:", slot);

  return (
    <div className="exit-popup-overlay">
      <div className="popup-card">
        <div className="popup-header">
          <AlertTriangle size={32} className="icon-warning" />
          <h3>CẢNH BÁO DI CHUYỂN</h3>
        </div>

        <div className="popup-body">
          <p className="main-question">Hệ thống phát hiện xe đang rời khỏi vị trí:</p>
          
          <div className="slot-info-box">
            <MapPin size={20} className="icon-pin" />
            <div className="slot-text">
              <span className="label">Vị trí:</span>
              <span className="value">Tầng {slot.floor} - Ô {slot.column}{slot.row}</span>
            </div>
          </div>

          <p className="sub-question">Bạn có đang là người thực hiện lấy xe không?</p>
        </div>

        <div className="popup-btns">
          <button className="btn-yes" onClick={onYes}>
            <CheckCircle2 size={18} />
            <span>Đúng, là tôi</span>
          </button>
          <button className="btn-no" onClick={onNo}>
            <XCircle size={18} />
            <span>Không phải tôi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmPopup;