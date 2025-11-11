export async function fetchParkingData() {
  try {
    const res = await fetch("/db.json");
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}
