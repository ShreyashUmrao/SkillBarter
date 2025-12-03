from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from passlib.context import CryptContext
from auth import create_access_token, verify_access_token
import os

from database import Base, engine, get_db, SessionLocal
import models
from schemas import (
    UserCreate, UserLogin,
    SkillCreate, SkillUpdate,
    TradeRequestCreate
)

app = FastAPI(title="Skill Barter API", version="1.0.0")
Base.metadata.create_all(bind=engine)

allowed = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_id = verify_access_token(token)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, email=user.email, password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User registered successfully", "user": db_user.username}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token(db_user.id)
    return {"token": token}

@app.get("/profile")
def profile(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }

@app.post("/skills")
def add_skill(skill: SkillCreate, db: Session = Depends(get_db),
              current_user: models.User = Depends(get_current_user)):
    s = models.Skill(
        name=skill.name,
        description=skill.description,
        category=skill.category,
        user_id=current_user.id
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@app.get("/skills")
def get_skills(db: Session = Depends(get_db),
               current_user: models.User = Depends(get_current_user)):
    return db.query(models.Skill).filter(models.Skill.user_id == current_user.id).all()

@app.get("/users/me")
def get_my_profile(db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    user = (
        db.query(models.User)
        .options(joinedload(models.User.skills))
        .filter(models.User.id == current_user.id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "skills": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "description": s.description,
            }
            for s in user.skills
        ],
    }

@app.get("/users/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .options(joinedload(models.User.skills))
        .filter(models.User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "skills": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "description": s.description,
            }
            for s in user.skills
        ],
    }

@app.get("/search")
def search_skills(
    q: str = "",
    category: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = (
        db.query(models.Skill)
        .options(joinedload(models.Skill.owner))
        .filter(models.Skill.user_id != current_user.id)
    )
    if q:
        query = query.filter(models.Skill.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(models.Skill.category.ilike(f"%{category}%"))
    skills = query.all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "category": s.category,
            "owner": {
                "id": s.owner.id if s.owner else s.user_id,
                "username": s.owner.username if s.owner else None,
                "email": s.owner.email if s.owner else None,
            },
        }
        for s in skills
    ]

@app.post("/trade/request")
def send_trade_request(req: TradeRequestCreate, db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    if current_user.id == req.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send trade request to yourself")
    skill = db.query(models.Skill).filter(models.Skill.id == req.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if skill.user_id != req.receiver_id:
        raise HTTPException(status_code=400, detail="Receiver ID mismatch")
    trade = models.TradeRequest(
        sender_id=current_user.id,
        receiver_id=req.receiver_id,
        skill_id=req.skill_id,
        status="pending"
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return {"message": "Trade request sent", "request_id": trade.id}

@app.get("/trade/requests")
def get_trade_requests(db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    received = (
        db.query(models.TradeRequest)
        .options(
            joinedload(models.TradeRequest.skill),
            joinedload(models.TradeRequest.sender),
            joinedload(models.TradeRequest.receiver),
        )
        .filter(models.TradeRequest.receiver_id == current_user.id)
        .all()
    )
    sent = (
        db.query(models.TradeRequest)
        .options(
            joinedload(models.TradeRequest.skill),
            joinedload(models.TradeRequest.sender),
            joinedload(models.TradeRequest.receiver),
        )
        .filter(models.TradeRequest.sender_id == current_user.id)
        .all()
    )

    def serialize(r):
        return {
            "id": r.id,
            "status": r.status,
            "skill": r.skill.name if r.skill else None,
            "sender": r.sender.username if r.sender else None,
            "receiver": r.receiver.username if r.receiver else None,
            "sender_id": r.sender_id,
            "receiver_id": r.receiver_id,
        }

    return {
        "received": [serialize(x) for x in received],
        "sent": [serialize(x) for x in sent],
    }

@app.put("/trade/requests/{req_id}/accept")
def accept_request(req_id: int, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    req = db.query(models.TradeRequest).filter(
        models.TradeRequest.id == req_id,
        models.TradeRequest.receiver_id == current_user.id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Already processed")
    req.status = "accepted"
    db.commit()
    db.refresh(req)
    return {"status": "accepted"}

@app.put("/trade/requests/{req_id}/reject")
def reject_request(req_id: int, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    req = db.query(models.TradeRequest).filter(
        models.TradeRequest.id == req_id,
        models.TradeRequest.receiver_id == current_user.id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "rejected"
    db.commit()
    db.refresh(req)
    return {"status": "rejected"}

@app.get("/chat/user/{user_id}")
def get_conversation_with_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conversation_key = f"{min(current_user.id, user_id)}_{max(current_user.id, user_id)}"
    msgs = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.conversation_key == conversation_key)
        .order_by(models.ChatMessage.timestamp.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "message": m.message,
            "timestamp": m.timestamp,
            "conversation_key": m.conversation_key,
        }
        for m in msgs
    ]

@app.get("/chat/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    convo_keys = (
        db.query(models.ChatMessage.conversation_key)
        .filter(
            (models.ChatMessage.sender_id == current_user.id)
            | (models.ChatMessage.receiver_id == current_user.id)
        )
        .distinct()
        .all()
    )

    keys = [k[0] for k in convo_keys if k[0]]
    conversations = []

    for key in keys:
        u1, u2 = map(int, key.split("_"))
        partner_id = u2 if u1 == current_user.id else u1

        partner = db.query(models.User).filter(models.User.id == partner_id).first()
        latest = (
            db.query(models.ChatMessage)
            .filter(models.ChatMessage.conversation_key == key)
            .order_by(models.ChatMessage.timestamp.desc())
            .first()
        )

        conversations.append(
            {
                "conversation_key": key,
                "partner_id": partner_id,
                "partner_username": partner.username if partner else None,
                "latest_message": latest.message if latest else "",
                "timestamp": latest.timestamp.isoformat() if latest else None,
            }
        )

    conversations.sort(
        key=lambda c: c["timestamp"] or "",
        reverse=True
    )

    return {"conversations": conversations}

@app.get("/chat/{request_id}")
def get_chat_history(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    msgs = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.request_id == request_id)
        .order_by(models.ChatMessage.timestamp.asc())
        .all()
    )
    if not msgs:
        return []
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "message": m.message,
            "timestamp": m.timestamp,
        }
        for m in msgs
    ]

import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[allowed],
    cors_credentials=True,
)

connected_users = {}

@sio.event
async def connect(sid, environ):
    pass

@sio.event
async def disconnect(sid):
    for uid, user_sid in list(connected_users.items()):
        if user_sid == sid:
            del connected_users[uid]
            break

@sio.on("register")
async def register(sid, data):
    token = data.get("token")
    if not token:
        await sio.emit("register_error", {"error": "missing token"}, to=sid)
        return
    try:
        user_id = verify_access_token(token)
        connected_users[user_id] = sid
        await sio.emit("register_success", {"user_id": user_id}, to=sid)
    except Exception as e:
        await sio.emit("register_error", {"error": str(e)}, to=sid)

@sio.on("send_message")
async def handle_message(sid, data):
    db = SessionLocal()
    try:
        token = data.get("token")
        sender_id = verify_access_token(token)
        receiver_id = int(data["receiver_id"])
        request_id = data.get("request_id")
        text = data["message"].strip()

        if request_id is not None:
            try:
                request_id = int(request_id)
            except:
                request_id = None

        trade = None
        if request_id and request_id != 0:
            trade = db.query(models.TradeRequest).filter(models.TradeRequest.id == request_id).first()
            if not trade or trade.status != "accepted":
                await sio.emit("message_error", {"error": "Trade not accepted"}, to=sid)
                return

        conversation_key = f"{min(sender_id, receiver_id)}_{max(sender_id, receiver_id)}"

        msg = models.ChatMessage(
            sender_id=sender_id,
            receiver_id=receiver_id,
            request_id=request_id,
            message=text,
            conversation_key=conversation_key
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        out = {
            "id": msg.id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "message": text,
            "timestamp": msg.timestamp.isoformat(),
            "request_id": request_id,
            "conversation_key": msg.conversation_key,
        }

        recv_sid = connected_users.get(receiver_id)
        if recv_sid:
            await sio.emit("receive_message", out, to=recv_sid)
        await sio.emit("message_sent", out, to=sid)

    except Exception as e:
        await sio.emit("message_error", {"error": str(e)}, to=sid)
    finally:
        db.close()

asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)
