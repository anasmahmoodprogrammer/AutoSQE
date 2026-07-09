# ⚙️ AutoSQE

**An autonomous, multi-agent AI system for rigorous Software Quality Engineering & Documentation.**

---

## 📖 Overview

If there is one universal bottleneck in software development, it is translating a great idea into rigorous, testable documentation. **AutoSQE** tackles this friction head-on by ingesting a raw project concept and automatically orchestrating a pipeline of AI personas to generate industry-standard **Software Requirements Specifications (SRS)**, **Requirement Traceability Matrices (RTM)**, and comprehensive **Test Cases**.

---

## 🚀 Architecture & Agent Workflow

Instead of relying on a single, massive LLM prompt, this system utilizes a multi-agent workflow to ensure high-fidelity, testable outputs.

### 1️⃣ Product Architect Agent
Expands the initial user concept to define:
- System boundaries
- Core objectives
- Target user personas

### 2️⃣ Systems Analyst Agent
Analyzes the architectural vision and generates a structured JSON document containing:
- Functional Requirements (FR)
- Non-Functional Requirements (NFR)

### 3️⃣ QA Engineer Agent
Creates:
- Requirement Traceability Matrix (RTM)
- Boundary Value Test Cases
- Initial Software Test Documentation

---

## 🛠 Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Backend API** | FastAPI | High-performance asynchronous Python framework |
| **Orchestration** | LangGraph / CrewAI | Multi-agent workflow management |
| **LLM Engine** | OpenAI API | Powers intelligent AI agents |
| **Formatting** | JSON & Markdown | Structured, parseable document generation |

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/AutoSQE.git
cd AutoSQE
```

### 2. Create a Virtual Environment

**Linux/macOS**

```bash
python -m venv venv
source venv/bin/activate
```

**Windows**

```bash
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
LLM_API_KEY=your_api_key_here
```

---

## 💻 Usage

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Open your browser and visit:

```
http://127.0.0.1:8000/docs
```

Use the interactive Swagger UI to test the API by submitting a JSON payload containing:

- `project_name`
- `core_problem`

The system will automatically execute the multi-agent workflow and generate:

- Software Requirements Specification (SRS)
- Requirement Traceability Matrix (RTM)
- Software Test Cases

---

## ✨ Features

- 🤖 Multi-Agent AI Architecture
- 📄 Automatic SRS Generation
- 📋 Requirement Traceability Matrix (RTM)
- ✅ Automated Test Case Generation
- ⚡ FastAPI Backend
- 🧠 LLM-powered Documentation
- 📑 Structured JSON Output
- 🔄 Modular Agent Pipeline

---

## 📂 Project Structure

```text
AutoSQE/
│
├── agents/
│   ├── product_architect.py
│   ├── systems_analyst.py
│   └── qa_engineer.py
│
├── api/
├── prompts/
├── models/
├── utils/
├── main.py
├── requirements.txt
├── .env
└── README.md
```

---

## 🙏 Acknowledgments

Special thanks to **Lec. Afeera Bint e Tanveer** for her exceptional mentorship. The Software Requirements Specification (SRS), Software Quality Engineering (SQE), and documentation principles implemented in this project are inspired by her guidance and instruction.

---

## 👨‍💻 Author

**Muhammad Anas Mahmood**

Software Engineer  

---
