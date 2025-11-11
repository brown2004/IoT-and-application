import React from "react";
import "../styles/ParkingSlot.css";

const ParkingSlot = ({ id, status }) => {
  const isAvailable = status === "available";
  return (
    <div className={`slot ${isAvailable ? "available" : "occupied"}`}>
      <h3>Slot {id}</h3>
      <p>{isAvailable ? "Trống" : "Có xe"}</p>
    </div>
  );
};

export default ParkingSlot;
