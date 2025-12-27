const API_BASE_URL = import.meta.env.VITE_API_URL;

export const fetchParkingData = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/slots?active=true`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await res.json();
        // Backend của bạn trả về data nằm trong result.data
        return result.data || []; 
    } catch (error) {
        console.error("Lỗi fetch slots:", error);
        return [];
    }
};