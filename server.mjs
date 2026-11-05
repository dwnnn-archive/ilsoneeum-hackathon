import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleAssistantRequest } from "./server/assistant.js";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const publicFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/styles.css", "styles.css"],
  ["/app.js", "app.js"],
]);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function sendText(response, status, message) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(message);
}

const server = createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    sendText(response, 400, "Bad request");
    return;
  }

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/health" && request.method === "GET") {
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }

    try {
      if (await handleAssistantRequest(request, response)) return;
    } catch (error) {
      console.error("Unable to handle assistant request:", error);
      if (!response.headersSent) {
        response.writeHead(500, {
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        });
        response.end(JSON.stringify({ error: "요청을 처리하지 못했습니다." }));
      }
      return;
    }
    sendText(response, 404, "Not found");
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD", "X-Content-Type-Options": "nosniff" });
    response.end("Method not allowed");
    return;
  }

  const fileName = publicFiles.get(pathname);
  if (!fileName) {
    sendText(response, 404, "페이지를 찾을 수 없습니다.");
    return;
  }

  try {
    const filePath = path.join(projectRoot, fileName);
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Length": content.length,
      "Content-Type": contentTypes[path.extname(filePath)],
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    console.error("Unable to serve public file:", error);
    sendText(response, 500, "Internal server error");
  }
});

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

server.listen(port, "0.0.0.0", () => {
  console.log(`일손이음 is listening on port ${port}`);
});
