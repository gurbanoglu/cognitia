from core.tasks import handle_ai_request_job

def trigger_ai_request_job(request_id: str):
  handle_ai_request_job.delay(request_id)