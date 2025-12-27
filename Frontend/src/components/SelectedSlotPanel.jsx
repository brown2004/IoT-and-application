const SelectedSlotPanel = ({ slot, onClear }) => {y
  if (!slot) return null; 

  return (
    <div className="selected-slot-panel">
      <div className="panel-header">
        <span className="icon">📍</span>
        <h3>Vị trí xe của bạn</h3>
      </div>

      <div className="slot-box">
        <p className="slot-info">
          Tầng: <strong>{slot.floor}</strong> | Ô: <strong>{slot.row}-{slot.column}</strong>
        </p>
        <p className="slot-status">
          Trạng thái: <span className="status-tag">Đang giám sát</span>
        </p>
      </div>

      <button className="clear-btn" onClick={onClear}>
         Bỏ đánh dấu
      </button>
    </div>
  );
};

export default SelectedSlotPanel;