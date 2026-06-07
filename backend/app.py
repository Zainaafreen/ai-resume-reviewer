import os
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from pypdf import PdfReader
from dotenv import load_dotenv
import io

load_dotenv()

app = Flask(__name__)
CORS(app)

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY not set. Add it to backend/.env")

client = Groq(api_key=api_key)

SYSTEM_PROMPT = """You are an expert resume reviewer and career coach with deep knowledge of ATS (Applicant Tracking Systems), hiring practices, and industry standards.

Analyze the provided resume and return a JSON response with this EXACT structure (no markdown, no extra text, just raw JSON):

{
  "ats_score": <integer 0-100>,
  "overall_grade": "<A+|A|A-|B+|B|B-|C+|C|C-|D|F>",
  "summary": "<2-3 sentence overall assessment>",
  "sections": {
    "contact": { "score": <0-100>, "status": "<good|warning|critical>", "feedback": "<feedback>" },
    "summary": { "score": <0-100>, "status": "<good|warning|critical>", "feedback": "<feedback>" },
    "experience": { "score": <0-100>, "status": "<good|warning|critical>", "feedback": "<feedback>" },
    "education": { "score": <0-100>, "status": "<good|warning|critical>", "feedback": "<feedback>" },
    "skills": { "score": <0-100>, "status": "<good|warning|critical>", "feedback": "<feedback>" },
    "formatting": { "score": <0-100>, "status": "<good|warning|critical>", "feedback": "<feedback>" }
  },
  "gaps": [
    { "type": "<critical|warning|info>", "title": "<title>", "description": "<description>" }
  ],
  "improvements": [
    { "priority": "<high|medium|low>", "category": "<category>", "suggestion": "<actionable suggestion>", "example": "<optional example or null>" }
  ],
  "keywords": {
    "found": ["<keyword1>", "<keyword2>"],
    "missing": ["<keyword1>", "<keyword2>"],
    "density_score": <0-100>
  },
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "job_match": {
    "best_roles": ["<role1>", "<role2>", "<role3>"],
    "industries": ["<industry1>", "<industry2>"]
  }
}

Be specific, actionable, and honest. ATS score should reflect actual ATS compatibility (keyword density, formatting, standard sections). Provide at least 4 gaps and 5 improvements."""


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/analyze", methods=["POST"])
def analyze_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    file = request.files["resume"]
    job_description = request.form.get("job_description", "")

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        pdf_bytes = file.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        resume_text = ""
        for page in reader.pages:
            resume_text += page.extract_text() or ""

        if not resume_text.strip():
            return jsonify({"error": "Could not extract text from PDF. Please ensure it's not a scanned image."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to parse PDF: {str(e)}"}), 400

    user_prompt = f"RESUME TEXT:\n{resume_text}"
    if job_description.strip():
        user_prompt += f"\n\nTARGET JOB DESCRIPTION:\n{job_description}\n\nPlease also evaluate how well this resume matches the job description and adjust the ATS score accordingly."

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        result = json.loads(raw)
        return jsonify({"success": True, "data": result})

    except json.JSONDecodeError as e:
        return jsonify({"error": "Failed to parse AI response", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"AI API error: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("DEBUG", "false").lower() == "true")
