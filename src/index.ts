export interface Env {
  EMAIL_FIB: KVNamespace;
  account_id: string;
  API_TOKEN: string;
}

const handler: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const requestData = await request.json();
    // @ts-ignore
    const key = requestData.username;
    // @ts-ignore
    const value = requestData.email;

    let responseMessage = "";
    let statusCode = 200;

    // Check if the key already exists in the KV store
    const existingValue = await env.EMAIL_FIB.get(key);
    if (existingValue === null) {
      await env.EMAIL_FIB.put(key, value);
      responseMessage = "Entry added to the KV store";
    } else {
      responseMessage = "Entry already exists";
      statusCode = 409;
    }

    const outboundURL = `https://api.cloudflare.com/client/v4/accounts/${env.account_id}/email/routing/addresses`; 
  
    const outboundResponse = await fetch(outboundURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.API_TOKEN}`
      },
      body: JSON.stringify({
        email: `${value}`,
      }),
    });

    return new Response(responseMessage, { status: statusCode });
  },
};

export default handler;