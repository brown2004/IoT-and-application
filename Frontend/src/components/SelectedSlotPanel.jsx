import React from "react";
import { MapPin, Info, XCircle, ShieldCheck } from "lucide-react";
import "../styles/SelectedSlotPanel.css";

const SelectedSlotPanel = ({ slot, onClear }) => {
  if (!slot) return null;

  return (
    <div className="selected-slot-panel">
      <div className="panel-content">
        <div className="panel-header">
          <div className="header-title">
            <MapPin size={20} className="icon-pin" />
            <h3>Vị trí xe của bạn</h3>
          </div>
          <button className="icon-close-btn" onClick={onClear} title="Bỏ đánh dấu">
            <XCircle size={20} />
          </button>
        </div>

        <div className="slot-details">
          <div className="detail-item">
            <span className="label">Tầng</span>
            <span className="value">{slot.floor}</span>
          </div>
          <div className="detail-divider"></div>
          <div className="detail-item">
            <span className="label">Vị trí</span>
            <span className="value">{slot.row}-{slot.column}</span>
          </div>
        </div>

        <div className="status-container">
          <div className="status-badge">
            <ShieldCheck size={14} />
            <span>Hệ thống đang giám sát</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedSlotPanel;