import React from "react";
import { X, Clock, CalendarOff, Save } from "lucide-react";

const TimeConfigModal = ({ 
  isOpen, 
  onClose, 
  openingTime, 
  closingTime, 
  isAllDayClosed,
  onSave 
}) => {
  if (!isOpen) return null;

  const [tempOpen, setTempOpen] = React.useState(openingTime);
  const [tempClose, setTempClose] = React.useState(closingTime);
  const [tempIsClosed, setTempIsClosed] = React.useState(isAllDayClosed);

  return (
    <div className="modal-overlay">
      <div className="time-config-card">
        <div className="modal-header">
          <h3><Clock size={20} /> Cấu hình vận hành</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="config-section">
            <label className="switch-container">
              <input 
                type="checkbox" 
                checked={tempIsClosed} 
                onChange={(e) => setTempIsClosed(e.target.checked)} 
              />
              <span className="switch-label">
                <CalendarOff size={18} /> Nghỉ cả ngày hôm nay
              </span>
            </label>
          </div>

          <div className={`time-inputs ${tempIsClosed ? 'disabled' : ''}`}>
            <div className="input-field">
              <label>Giờ mở cửa</label>
              <input 
                type="time" 
                value={tempOpen} 
                onChange={(e) => setTempOpen(e.target.value)}
                disabled={tempIsClosed}
              />
            </div>
            <div className="input-field">
              <label>Giờ đóng cửa</label>
              <input 
                type="time" 
                value={tempClose} 
                onChange={(e) => setTempClose(e.target.value)}
                disabled={tempIsClosed}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Hủy</button>
          <button className="btn-save" onClick={() => onSave(tempOpen, tempClose, tempIsClosed)}>
            <Save size={18} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeConfigModal;