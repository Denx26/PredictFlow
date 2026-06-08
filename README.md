# PredictFlow — Autonomous AutoML Orchestrator

<p align="center">
  <img src="frontend/imgs/predictflow_logo_final.svg" alt="PredictFlow Logo" width="120" height="120">
</p>

PredictFlow is an intelligent machine learning orchestrator designed to transform raw tabular datasets into optimized, production-ready models through conversational natural language prompts. Leveraging an asynchronous dual-backend microservice architecture, the platform automatically infers data intent, cleans raw payloads, and triggers real-time optimization pipelines.

---

## 🏗️ Architecture

PredictFlow uses a decentralized microservices design built for scalable ML workloads:

| Layer | Technology Stack | Responsibility | Port |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | HTML5, Tailwind CSS v4, SignalR Client, SweetAlert2 | Responsive dashboard, telemetry streaming, AI insight rendering | `5500` / Static |
| **Orchestrator Backend** | C# ASP.NET Core Web API, SignalR, SQLite | Session management, async job spawning, WebSocket bridging | `5286` |
| **AutoML Processing Core** | Python FastAPI, FLAML, LangChain, Google Gemini | Intent evaluation, data engineering, pipeline optimization | `8000` |

---

## ⚡ Key Features

- **Natural Language Intent Parsing** — Users describe their ML goals in plain text. An integrated LLM analyzes the dataset schema to identify target columns and task types automatically.
- **Autonomous AutoML** — Powered by FLAML, the framework searches, tunes, and cross-validates competing algorithms (LightGBM, XGBoost, CatBoost, RandomForest) without manual configuration.
- **Real-Time Telemetry Streaming** — Training pipelines run in non-blocking background threads, with live progress and diagnostics pushed to the client via SignalR WebSockets.
- **Adaptive UI** — The interface rearranges dynamically based on pipeline state and user interactions.

---

## 🚀 Running Locally

### Prerequisites

Make sure you have the following installed:

- .NET 8.0 SDK or higher
- Python 3.10+ with pip
- A valid `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/)

---

### 1. AutoML Python Core

```bash
cd python_ai

# Create the environment variables file
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI service
python3 -m uvicorn main:app --reload --port 8000
```

### 2. .NET Orchestrator Backend

Open a separate terminal:

```bash
cd mainBackend

# Restore dependencies and start the server
dotnet run
```

> **Note:** On first startup, the app will automatically provision and migrate the local SQLite database (`predictflow.db`).

### 3. Frontend

Serve `frontend/index.html` using Live Server (`http://127.0.0.1:5500`) or open it directly in a modern browser.

---

## 📡 Data Flow

When a training pipeline is triggered, data moves across services as follows:

1. **`POST /api/orchestrate/run`** *(Client → C#)* — Accepts multipart dataset upload with user session token.
2. **`POST /api/v1/internal-predict`** *(C# → Python)* — The .NET backend proxies the dataset to the Python AutoML core for processing.
3. **`HubContext.Clients.Client().SendAsync("ReceiveReport")`** *(C# → Client)* — Processed results and telemetry are streamed back to the client in real time via SignalR.
