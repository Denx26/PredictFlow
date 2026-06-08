import os
import io
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from pathlib import Path
from flaml import AutoML  
from dotenv import load_dotenv

env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="PredictFlow - Pure Autonomous AutoML")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DatasetIntent(BaseModel):
    target_column: str = Field(description="The exact name of the column to predict from the dataset list.")
    task_type: str = Field(description="Must be 'classification' or 'regression' based on the nature of the target column.")

@app.post("/api/v1/internal-predict")
async def internal_predict(file: UploadFile = File(...), prompt: str = Form(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        api_key=os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
        
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            temperature=0,
            google_api_key=api_key
        )
        
        structured_llm = llm.with_structured_output(DatasetIntent)
        intent_prompt = f"Analyze user intent: '{prompt}'. Available columns in dataset: {list(df.columns)}."
        intent_result = structured_llm.invoke(intent_prompt)
        
        target = intent_result.target_column
        task = intent_result.task_type
        
        if target not in df.columns:
            target = df.columns[-1]
            
        df = df.dropna(subset=[target])
        
        X = df.drop(columns=[target])
        y = df[target]  

        for col in X.columns:
            if pd.api.types.is_numeric_dtype(X[col]):
                X[col] = X[col].fillna(X[col].mean())
            else:
                most_frequent = X[col].mode()
                fill_value = most_frequent[0] if not most_frequent.empty else "Unknown"
                X[col] = X[col].fillna(fill_value).astype(str)

        automl_engine = AutoML()
        automl_settings = {
            "time_budget": 2,  
            "metric": 'auto',
            "task": task,      
            "verbose": 0
        }
        
        automl_engine.fit(X_train=X, y_train=y, **automl_settings)
        
        best_model = automl_engine.best_estimator
        best_loss = automl_engine.best_loss
        
        best_score = 1 - best_loss if task == "classification" else 1 - best_loss
        
        report_prompt = (
            f"Write a professional 3-sentence summary in English for data analysis report of the file {file.filename}. "
            f"The target variable detected is '{target}' and the task type is '{task}'. "
            f"The automated engine selected the optimized model '{best_model}' with an internal evaluation metric of {best_score:.4f}. "
            f"Do not use markdown bold formatting like asterisks."
        )
        report_response = llm.invoke(report_prompt)
        
        return {
            "features_count": int(X.shape[1]),
            "rows_count": int(df.shape[0]),
            "target_detected": str(target),
            "task_detected": str(task).upper(),
            "best_algorithm": str(best_model).upper(),
            "score": str(f"{max(0, round(best_score * 100, 2))}%"),
            "mse": str(f"{best_loss:.4f}"),
            "report_markdown": str(report_response.content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
