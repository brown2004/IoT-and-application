import React, { useEffect, useState } from "react";
import ParkingSlot from "./ParkingSlot";
import { fetchParkingData } from "../api";
import "../styles/ParkingLot.css";

const ParkingLot = () => {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchParkingData();
      setSlots(data);
    };
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

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
          <ParkingSlot key={slot.id} id={slot.id} status={slot.status} />
        ))}
      </div>
    </div>
  );
};

export default ParkingLot;
