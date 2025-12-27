import React  from "react";
import "../styles/ExitConfirmPopup.css"

const ExitConfirmPopup = ({ slot, onYes, onNo }) => {
  return (
    <div className="exit-popup">
      <div className="popup-card">
        <h3>Xe của bạn rời khỏi chỗ {slot}</h3>
        <p>Bạn có đang lấy xe không?</p>

        <div className="popup-btns">
          <button className="yes" onClick={onYes}>Có</button>
          <button className="no" onClick={onNo}>Không</button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmPopup;
