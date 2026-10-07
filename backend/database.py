import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "meet_ai_db")

try:
    import certifi
    ca = certifi.where()
except ImportError:
    ca = None

kwargs = {}
if ca:
    kwargs["tlsCAFile"] = ca

client = AsyncIOMotorClient(MONGO_URI, **kwargs)
db = client[DB_NAME]


# Collections
users_collection = db.get_collection("users")
meetings_collection = db.get_collection("meetings")

async def check_db_connection():
    """Verify MongoDB connectivity by sending a ping command."""
    try:
        await client.admin.command('ping')
        print(f"[MongoDB] Connected successfully")
        return True
    except Exception as e:
        print(f"[MongoDB Error] Could not connect to database: {e}")
        return False

