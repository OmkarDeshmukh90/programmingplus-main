import BASE_URL from "../config";

export const askAI = async (msg) => {
  try {
    const res = await fetch(`${BASE_URL}/ai/ask-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: msg }),
    });

    if (!res.ok) throw new Error("AI request failed");

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error in askAI:", error);
    return { error: "Something went wrong" };
  }
};
