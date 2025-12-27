import React, { useEffect } from "react";
import "../styles/Notification.css"

const Notification = ({ message, type = "info", onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);

            return ()=>clearTimeout(timer)
        }
    }, [message]);

    if(!message) return null;

    return(
        <div className={`notification ${type}`}>
            <p>{message}</p>
        </div>
    )

}

export default Notification;