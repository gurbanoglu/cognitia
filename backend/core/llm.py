import openai
from openai import OpenAI


def call_llm(history: list[dict]) -> str:
  """
  Accepts a list of messages (from ChatMessage table), and returns
  the AI assistant's reply as a string.

  history example:
  [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi! How can I help?"}
  ]
  """

  # Convert history to OpenAI chat format
  openai_messages = [{"role": m["role"], "content": m["content"]} for m in history]

  # response = openai.ChatCompletion.create(
  #     model="gpt-4",
  #     messages=openai_messages,
  #     temperature=0.7
  # )

  client = OpenAI()

  try:
    response = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=openai_messages
    )
  except Exception as e:
    print(f"Failed to regenerate answer: {e}")
    raise

  return response.choices[0].message["content"]