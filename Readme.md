**SkillBarter**

A modern, full-stack skill-exchange platform built with FastAPI and React.
SkillBarter allows users to showcase their skills, discover others, send trade requests, and chat in real time — enabling a collaborative learning ecosystem without money.<br><br><br><br>


**Demo**

Live Demo: https://skillbarter-hu43.onrender.com <br><br><br><br>


**Features**

User Authentication (JWT) — secure login & registration
Skill Management — add, list, edit, and categorize skills
Skill Search — find other users’ skills by keyword or category
Trade Requests — send, accept, and reject skill-exchange requests
Real-Time Chat — instant messaging through Socket.IO
User Profiles — view skill lists & user details
Modern Frontend — React + Tailwind CSS
Clean API Architecture — organized FastAPI endpoints and Pydantic schemas
Dockerized — fully containerized (backend, frontend, database) <br><br><br><br>


**Tech Stack**

Backend:
FastAPI
SQLAlchemy
PostgreSQL
Pydantic v2
Socket.IO (ASGI)
Uvicorn

Frontend:
React
Axios
Socket.IO Client
TailwindCSS <br><br><br><br>


**Running the Project Locally**

Backend Setup:
cd backend
pip install -r requirements.txt
uvicorn main:asgi_app --reload

Backend will run at:
http://127.0.0.1:8000

Frontend Setup:
cd frontend
npm install
npm start

Frontend will run at:
http://127.0.0.1:3000 <br><br><br><br>


**Deployment**

SkillBarter is designed to be deployment-ready:
Works with Docker & Docker Compose
Environment-based configuration via .env
Stateless JWT authentication
Frontend served via Nginx
Backend runs on FastAPI + Uvicorn ASGI
Compatible with cloud platforms (Railway, Fly.io, Render, etc.)
