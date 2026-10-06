from pydantic import BaseModel
from typing import List


class ActionItem(BaseModel):
    task: str
    owner: str
    deadline: str


class MeetingRecord(BaseModel):
    summary: str
    minutes: List[str]
    decisions: List[str]
    action_items: List[ActionItem]