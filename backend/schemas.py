from pydantic import BaseModel
from typing import List,Optional


class ActionItem(BaseModel):
    task: str
    owner: str
    deadline: str


class MeetingRecord(BaseModel):
    summary: str
    minutes: List[str]
    decisions: List[str]
    action_items: List[ActionItem]

class UserRegister(BaseModel):
    name:str
    email:str
    password:str

class UserLogin(BaseModel):
    email:str
    password:str

class UserResponse(BaseModel):
    id:int
    name:str
    email:str
    meetings_transcribed:int
    meetings_analyzed:int


class TranscriptRefineRequest(BaseModel):
    raw_transcript: str


class DocumentationRequest(BaseModel):
    refined_transcript: str
    raw_transcript: Optional[str] = ""

