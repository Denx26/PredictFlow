# PredictFlow - Autonomous AutoML Orchestrator

<p align="center">
  <img src="image_94e5d2.png" alt="PredictFlow Logo" width="120" height="120">
</p>

PredictFlow is an intelligent, decentralized machine learning orchestrator designed to transform raw tabular datasets into optimized production-ready AI models through conversational natural language prompts. By leveraging an advanced asynchronous dual-backend microservice architecture, the platform automatically infers data intent, cleans raw payloads, and triggers real-time optimization pipelines.

---

## 🏗️ Architecture Topology

PredictFlow utilizes a decentralized microservices design pattern engineered for heavy compute scaling:

| Layer | Technology Stack | Responsibility | Port |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | HTML5, Tailwind CSS v4, SignalR Client, SweetAlert2 | Responsive dashboard, telemetry streaming, RAG insight rendering | `5500` / Static |
| **Orchestrator Backend** | C# ASP.NET Core Web API, SignalR, SQLite | User session storage, async background job spawning, WebSocket bridging | `5286` |
| **AutoML Processing Core** | Python FastAPI, FLAML, LangChain, Google Gemini | Structured intent evaluation, dynamic data engineering, pipeline optimization | `8000` |

---

## ⚡ Key Features

* **Natural Language Intent Parsing**: Users describe their forecasting goals in plain text. An integrated LLM analyzes the dataset schema via structured output to identify targets and tasks.
* **Pure Autonomous AutoML**: Powered by FLAML, the framework automatically searches, tunes, and cross-validates competing algorithms (LightGBM, XGBoost, CatBoost, RandomForest) to extract top-tier weights without pre-baked configurations.
* **Asynchronous Telemetry Socket Stream**: Heavy computing pipelines run safely inside non-blocking threads. System diagnostics are pushed back to the client downstream in real time over SignalR WebSockets.
* **Adaptive Visual UX**: UI layouts rearrange dynamically based on user control nodes interaction metrics.

---

## 🚀 Local Run Guide

### 1. Prerequisites
Ensure you have the following installed locally on your environment:
* .NET 8.0 SDK or higher
* Python 3.10+ with pip
* A valid `GEMINI_API_KEY` from Google AI Studio

### 2. AutoML Python Core Service Setup
Navigate to the processing directory, establish your credentials, install dependencies, and fire up the Uvicorn engine:
```bash
cd python_ai

# Setup your local environment variables file
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env

# Install requirement packages
pip install -r requirements.txt

# Start the FastAPI microservice
python3 -m uvicorn main:app --reload --port 8000
