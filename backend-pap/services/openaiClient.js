/**
 * openaiClient.js
 * Thin wrapper around the OpenAI Chat Completions API.
 * Uses Node's built-in https — no extra SDK needed.
 */

const https = require("https");

/**
 * Call the OpenAI Chat Completions API.
 * @param {Array<{role:string, content:string}>} messages
 * @param {object} opts
 * @param {string}  opts.model         - defaults to "gpt-4o-mini"
 * @param {number}  opts.maxTokens     - defaults to 1000
 * @param {number}  opts.temperature   - defaults to 0.1
 * @param {number}  opts.timeoutMs     - defaults to 30000
 * @returns {Promise<string>} - the assistant message content
 */
function chatCompletion(messages, opts = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada no .env");

  const model = opts.model || "gpt-4o-mini";
  const maxTokens = opts.maxTokens || 1000;
  const temperature = opts.temperature ?? 0.1;
  const timeoutMs = opts.timeoutMs || 30000;

  const body = JSON.stringify({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: opts.jsonMode ? { type: "json_object" } : undefined,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode !== 200) {
              const msg = parsed?.error?.message || `HTTP ${res.statusCode}`;
              return reject(new Error(`OpenAI API: ${msg}`));
            }
            const content = parsed?.choices?.[0]?.message?.content || "";
            resolve(content);
          } catch (e) {
            reject(new Error("Resposta inválida da OpenAI"));
          }
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("Timeout na chamada à OpenAI"));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = { chatCompletion };
