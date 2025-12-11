import math
from dataclasses import dataclass
#hello hi
@dataclass
class LatLng:
    lat: float
    lon: float

def haversine_m(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    p = math.pi/180
    dlat = (lat2-lat1)*p
    dlon = (lon2-lon1)*p
    a = math.sin(dlat/2)**2 + math.cos(lat1*p)*math.cos(lat2*p)*math.sin(dlon/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R*c
