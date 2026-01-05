import React from "react";
import "../styles/ParkingSlot.css";

const ParkingSlot = ({ id, floor, row, column, status, isSelected, onSelect }) => {
  return (
    <div
      className={`parking-slot ${status} ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect()}
    >
      <div className="slot-header">
        <span className="floor-tag">Tầng {floor}</span>
        <span className="position-tag">{row}-{column}</span>
      </div>

      <div className="slot-body">
        {status === "Occupied" ? (
          <span className="car-icon">Có xe</span>
        ) : (
          <span className="empty-icon">...</span>
        )}
      </div>

      {isSelected && <div className="my-spot-label">Xe của bạn</div>}
      
      {status === "Occupied" && !isSelected && (
        <span className="Occupied-text">Đã đỗ</span>
      )}
    </div>
  );
};

export default ParkingSlot;