# Replicate Integration Architecture

This document details the architectural pattern used to integrate with Replicate's AI models (specifically `gemini-3-pro`) within the ClipSaver "Extraction Station".

## 1. The Challenge
AI models like `gemini-3-pro` ("Thinking models") can take significantly longer to generate responses than standard LLMs—often exceeding 60 seconds. 

Web browsers and standard HTTP clients typically timeout requests after 30-60 seconds. A direct Synchronous request (`Frontend -> Backend -> Replicate (WAIT) -> Backend -> Frontend`) causes the browser to disconnect before the AI is finished, leading to "Network Error" or 504 Gateway Timeouts.

## 2. The Solution: Async Webhook Pattern
To solve this, we implemented an **Asynchronous Job System** with **Webhooks**.

### High-Level Flow
1.  **Frontend** requests a job (e.g. "Generate Script").
2.  **Backend** acknowledges immediately, returning a `jobId`.
3.  **Backend** triggers Replicate in the background, telling it to "call us back" at a specific URL (`webhook_url`) when done.
4.  **Frontend** polls the Backend every 2 seconds: "Is `jobId` done?"
5.  **Replicate** finishes processing and sends a POST request (Webhook) to our Backend.
6.  **Backend** updates the database with the result.
7.  **Frontend**'s next poll sees the result and displays it.

---

## 3. Database Schema
We introduced a new model `AsyncJob` to track the state of these long-running tasks.

**File:** `backend/models.py`

```python
class AsyncJob(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    type: str  # e.g., "video_outline", "title_generation", "script_generation"
    status: str = Field(default="pending")  # pending, processing, succeeded, failed
    input_payload: Optional[str] = None     # JSON string of input args (for debugging)
    prediction_id: Optional[str] = None     # Replicate's ID
    output: Optional[str] = None            # The final AI text result
    error: Optional[str] = None             # Error message if failed
    created_at: int
    updated_at: int
    user_id: uuid.UUID = Field(foreign_key="user.id")
```

---

## 4. Backend Implementation

### A. Initiating the Job (`routers/ideation.py`)
When the frontend requests `/api/ideation/generate-script`:
1.  We **create** an `AsyncJob` in the DB with status `pending`.
2.  We **call** `ai_agent.generate_viral_script_async`.
3.  We **save** the Replicate `prediction_id` to the job.
4.  We **return** `{"jobId": "..."}` to the client immediately.

### B. The AI Agent (`ai_agent.py`)
Instead of `client.run()` (blocking), we use `client.predictions.async_create()`:

```python
await client.predictions.async_create(
    version="google/gemini-3-pro",
    input={...},
    webhook=os.getenv("REPLICATE_WEBHOOK_URL"), # Crucial!
    webhook_events_filter=["completed"] # Only notify when done
)
```

### C. Receiving the Webhook (`routers/webhooks.py`)
This endpoint is publicly accessible (via Ngrok in dev). Replicate POSTs here when done.

```python
@router.post("/replicate")
async def replicate_webhook(payload: dict):
    # 1. Extract prediction ID and Status from payload
    # 2. Find the AsyncJob in our DB
    # 3. Update job.status = "succeeded"
    # 4. Update job.output = payload["output"]
```

### D. Polling Endpoint (`routers/jobs.py`)
The frontend calls this repeatedly.

```python
@router.get("/{job_id}")
def get_job_status(job_id: str):
    # Returns { status: "succeeded", output: "..." }
```

---

## 5. Frontend Implementation

### A. API Utility (`utils/workflowApi.ts`)
Added `getJob(jobId)` to fetch status.

### B. Polling Logic (e.g., `ScriptWritingSection.tsx`)
```typescript
const pollJob = async (jobId) => {
    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            const job = await workflowApi.getJob(jobId);
            if (job.status === 'succeeded') {
                clearInterval(interval);
                resolve(job.output);
            }
        }, 2000);
    });
}
```

---

## 6. Development Setup (Critical)

For Replicate to send webhooks to your local machine (`localhost:8000`), you need a tunnel.

1.  **Install Ngrok**: `brew install ngrok`
2.  **Start Tunnel**: `ngrok http 3001` (Assuming backend port 3001)
3.  **Copy URL**: e.g., `https://b123-45-67-89.ngrok-free.app`
4.  **Update .env**:
    ```bash
    REPLICATE_WEBHOOK_URL=https://b123-45-67-89.ngrok-free.app/api/webhooks/replicate
    ```

**Troubleshooting:**
*   **404 on Webhook**: Check if `REPLICATE_WEBHOOK_URL` in `.env` matches your current Ngrok URL.
*   **Job Stuck in Pending**: Replicate might not be firing the webhook, or your Ngrok tunnel is down. Check Ngrok terminal logs.
