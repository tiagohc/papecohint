const EASYPAY_BASE_TEST = "https://api.test.easypay.pt/2.0";
const EASYPAY_BASE_PROD = "https://api.prod.easypay.pt/2.0";

function getBaseUrl() {
  return process.env.EASYPAY_ENV === "prod" ? EASYPAY_BASE_PROD : EASYPAY_BASE_TEST;
}

function getHeaders() {
  const accountId = process.env.EASYPAY_ACCOUNT_ID;
  const apiKey = process.env.EASYPAY_API_KEY;

  if (!accountId || !apiKey) {
    throw new Error("EASYPAY_ACCOUNT_ID ou EASYPAY_API_KEY não configurados no .env");
  }

  return {
    AccountId: accountId,
    ApiKey: apiKey,
    "Content-Type": "application/json",
  };
}

async function easypayPost(path, body) {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(`EasyPay API error: ${res.status}`);
    err.response = { status: res.status, data };
    throw err;
  }

  return data;
}

async function easypayGet(path) {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(`EasyPay API error: ${res.status}`);
    err.response = { status: res.status, data };
    throw err;
  }

  return data;
}

module.exports = { easypayPost, easypayGet };
