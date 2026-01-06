import React, { useState } from "react";
import { Lock, Unlock, Loader2, Fence } from "lucide-react";
import "../styles/GateControlPanel.css";

const GateControlPanel = ({ isAdmin, API_BASE_URL }) => {
  const [loading, setLoading] = useState(false);
  const [gateStatus, setGateStatus] = useState("unknown"); // 'open', 'close', 'unknown'

  if (!isAdmin) return null;

  const handleGateControl = async (action) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/iot/gate/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setGateStatus(action);
      } else {
        alert("Không thể điều khiển cổng. Vui lòng kiểm tra MQTT!");
      }
    } catch (error) {
      console.error("Gate Control Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gate-control-panel">
      <div className="gate-header">
        <Fence size={18} />
        <span>Điều khiển cổng chính</span>
      </div>
      
      <div className="gate-actions">
        <button 
          className={`gate-btn open ${gateStatus === 'open' ? 'active' : ''}`}
          onClick={() => handleGateControl("open")}
          disabled={loading}
        >
          {loading ? <Loader2 className="spinner" size={16} /> : <Unlock size={16} />}
          Mở cổng
        </button>

        <button 
          className={`gate-btn close ${gateStatus === 'close' ? 'active' : ''}`}
          onClick={() => handleGateControl("close")}
          disabled={loading}
        >
          {loading ? <Loader2 className="spinner" size={16} /> : <Lock size={16} />}
          Đóng cổng
        </button>
      </div>
    </div>
  );
};

export default GateControlPanel;