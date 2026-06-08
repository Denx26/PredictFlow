import os
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from flaml import AutoML
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

class DatasetIntent(BaseModel):
    target_column: str = Field(description="The exact name of the column to predict.")
    task_type: str = Field(description="Must be 'classification' or 'regression'.")

@app.post("/api/v1/internal-predict")
async def internal_predict(file: UploadFile = File(...), prompt: str = Form(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash", 
            temperature=0,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        
        structured_llm = llm.with_structured_output(DatasetIntent)
        
        intent_prompt = f"Analyze intent. User wants: '{prompt}'. Columns: {list(df.columns)}."
        intent_result = structured_llm.invoke(intent_prompt)
        target, task = intent_result.target_column, intent_result.task_type
        
        
        # small data cleaning when user parse an csv also automl 
        df = df.dropna(subset=[target])
        X, y = df.drop(columns=[target]), df[target]
        
        automl = AutoML()
        automl.fit(X_train=X, y_train=y, task=task, time_budget=10, verbose=0)
        
        best_model = automl.best_estimator
        best_score = 1 - automl.best_loss if task == "classification" else automl.best_loss
        
        
        report_prompt = f"Write a 3-sentence executive report in English for dataset {file.filename}. Target: {target}. Model: {best_model} with score {best_score:.4f}."
        report_response = llm.invoke(report_prompt)
        
        return {
            "features_count": df.shape[1] - 1,
            "rows_count": int(df.shape[0]),
            "target_detected": target,
            "task_detected": task,
            "best_algorithm": best_model,
            "score": round(best_score, 4),
            "report_markdown": report_response.content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
