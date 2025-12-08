import sys
import os

# Add the project root to the Python path to import common modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from common.db import get_db

def init_stations():
    db = get_db()
    stations_collection = db.stations

    stations_data = [
        {
            "id": "MG_ROAD",
            "name": "MG Road Metro",
            "lat": 12.9756,
            "lon": 77.6069,
            "nearbyAreas": ["Indiranagar", "Domlur", "Ulsoor", "Ashok Nagar"],
        },
        {
            "id": "TRINITY",
            "name": "Trinity Metro",
            "lat": 12.9730,
            "lon": 77.6170,
            "nearbyAreas": ["HAL", "Old Airport Road", "Jeevanbhima Nagar"],
        },
        {
            "id": "RV_ROAD",
            "name": "RV Road Metro",
            "lat": 12.9213,
            "lon": 77.5802,
            "nearbyAreas": ["Basavanagudi", "Gandhi Bazaar", "Jayanagar"],
        },
        {
            "id": "CUBBON_PARK",
            "name": "Cubbon Park Metro",
            "lat": 12.9809,
            "lon": 77.5975,
            "nearbyAreas": ["MG Road", "Brigade Road", "Shivaji Nagar"],
        },
        # Additional Stations
        {
            "id": "INDIRANAGAR",
            "name": "Indiranagar Metro",
            "lat": 12.9783,
            "lon": 77.6386,
            "nearbyAreas": ["Indiranagar 100ft Road", "CMH Road", "New Tippasandra"],
        },
        {
            "id": "BAIYAPPANAHALLI",
            "name": "Baiyappanahalli Metro",
            "lat": 12.9907,
            "lon": 77.6523,
            "nearbyAreas": ["CV Raman Nagar", "Kasturi Nagar", "Old Madras Road"],
        },
        {
            "id": "MAJESTIC",
            "name": "Nadaprabhu Kempegowda (Majestic)",
            "lat": 12.9757,
            "lon": 77.5728,
            "nearbyAreas": ["Gandhinagar", "Chickpet", "Cottonpet", "KSR Railway Station"],
        },
        {
            "id": "VIJAYANAGAR",
            "name": "Vijayanagar Metro",
            "lat": 12.9709,
            "lon": 77.5374,
            "nearbyAreas": ["Vijayanagar", "RPC Layout", "Chandra Layout"],
        },
        {
            "id": "JAYANAGAR",
            "name": "Jayanagar Metro",
            "lat": 12.9295,
            "lon": 77.5801,
            "nearbyAreas": ["Jayanagar 4th Block", "Tilak Nagar", "Yediyur"],
        },
        {
            "id": "BANASHANKARI",
            "name": "Banashankari Metro",
            "lat": 12.9152,
            "lon": 77.5735,
            "nearbyAreas": ["Banashankari 2nd Stage", "Padmanabhanagar", "Kumaraswamy Layout"],
        }
    ]

    print("Initializing stations database...")
    
    for s in stations_data:
        # Map user format to DB format used in station_svc.py
        doc = {
            "_id": s["id"],
            "name": s["name"],
            "location": {"lat": s["lat"], "lon": s["lon"]},
            "nearby_areas": s["nearbyAreas"]
        }
        
        # Upsert: Insert if new, update if exists
        result = stations_collection.replace_one({"_id": s["id"]}, doc, upsert=True)
        
        action = "Updated" if result.matched_count > 0 else "Inserted"
        print(f"{action} station: {s['name']} ({s['id']})")

    print(f"\nSuccessfully initialized {len(stations_data)} stations.")

if __name__ == "__main__":
    init_stations()