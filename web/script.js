(() => {
  const $ = (id) => document.getElementById(id);

  const statusDot = $("statusDot");
  const statusText = $("statusText");
  const messagesEl = $("messages");
  const nameEl = $("name");
  const wsPathEl = $("wsPath");
  const connectBtn = $("connectBtn");
  const form = $("form");
  const textEl = $("text");
  const sendBtn = $("sendBtn");

  const LS_NAME = "ws-chat:name";
  const LS_PATH = "ws-chat:wsPath";

  let ws = null;
  let reconnectTimer = null;
  let shouldReconnect = true;

  function setStatus(state, text) {
    statusDot.dataset.state = state; // offline | connecting | online
    statusText.textContent = text;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function addSystemLine(text) {
    const div = document.createElement("div");
    div.className = "msg system";
    div.innerHTML = `<div class="meta">system</div><div class="body">${escapeHtml(text)}</div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessageLine(msg) {
    const sender = msg?.sender || "unknown";
    const content = msg?.content || "";
    const ts = msg?.timestamp ? new Date(msg.timestamp) : null;
    const timeText = ts && !Number.isNaN(ts.getTime()) ? ts.toLocaleTimeString() : "";
    const type = msg?.type || "message";

    const div = document.createElement("div");
    div.className = `msg ${type === "system" ? "system" : ""}`.trim();
    div.innerHTML = `
      <div class="meta">
        <span class="sender">${escapeHtml(sender)}</span>
        <span class="time">${escapeHtml(timeText)}</span>
      </div>
      <div class="body">${escapeHtml(content)}</div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function buildWSUrl(path) {
    if (path.startsWith("ws://") || path.startsWith("wss://")) {
      return path;
    }
    const p = path.startsWith("/") ? path : `/${path}`;
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = location.hostname || "localhost";
    const port = location.port || (location.protocol === "https:" ? "443" : "8080");
    const host = location.host || `${hostname}:${port}`;
    return `${proto}//${host}${p}`;
  }

  function currentName() {
    const v = nameEl.value.trim();
    return v || "anon";
  }

  function currentPath() {
    const v = wsPathEl.value.trim();
    if (!v) return "/ws";
    // Убираем протокол и хост, если пользователь случайно ввёл полный URL
    if (v.startsWith("ws://") || v.startsWith("wss://")) {
      const match = v.match(/^(wss?:\/\/[^\/]+)(\/.*)?$/);
      if (match) return match[2] || "/ws";
    }
    // Убираем хост, если есть
    if (v.includes("://")) {
      const parts = v.split("/");
      return "/" + parts.slice(3).join("/") || "/ws";
    }
    return v.startsWith("/") ? v : `/${v}`;
  }

  function connect() {
    const path = currentPath();
    const url = buildWSUrl(path);

    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus("connecting", "connecting…");
    addSystemLine(`connecting to ${url}`);

    try {
      ws = new WebSocket(url);
    } catch (e) {
      setStatus("offline", "offline");
      addSystemLine(`failed to create websocket: ${String(e)}`);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      setStatus("online", "online");
      addSystemLine("connected");
      sendBtn.disabled = false;
    };

    ws.onmessage = (event) => {
      const raw = event.data;
      if (typeof raw !== "string") return;

      try {
        const msg = JSON.parse(raw);
        addMessageLine(msg);
      } catch {
        // If server ever sends plain text, still show it.
        addMessageLine({ sender: "server", content: raw, timestamp: nowISO(), type: "system" });
      }
    };

    ws.onclose = (e) => {
      setStatus("offline", "offline");
      sendBtn.disabled = true;
      const reason = e.code ? ` (code: ${e.code}, reason: ${e.reason || "none"})` : "";
      addSystemLine(`disconnected${reason}`);
      scheduleReconnect();
    };

    ws.onerror = (e) => {
      setStatus("offline", "error");
      addSystemLine(`websocket error: ${String(e)}`);
    };
  }

  function scheduleReconnect() {
    if (!shouldReconnect) return;
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 1200);
  }

  function disconnect() {
    shouldReconnect = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      try {
        ws.close();
      } catch {}
    }
    ws = null;
    setStatus("offline", "offline");
    sendBtn.disabled = true;
    addSystemLine("manual disconnect");
  }

  function sendMessage(text) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      addSystemLine("not connected");
      return;
    }

    const payload = {
      type: "message",
      content: text,
      sender: currentName(),
      timestamp: nowISO(),
    };

    try {
      ws.send(JSON.stringify(payload));
    } catch (e) {
      addSystemLine(`send failed: ${String(e)}`);
    }
  }

  function init() {
    // Load defaults
    nameEl.value = localStorage.getItem(LS_NAME) || "";
    wsPathEl.value = localStorage.getItem(LS_PATH) || "/ws";

    // Allow override via query param: ?ws=/ws
    const params = new URLSearchParams(location.search);
    const wsParam = params.get("ws");
    if (wsParam) wsPathEl.value = wsParam;

    setStatus("offline", "offline");
    sendBtn.disabled = true;

    nameEl.addEventListener("input", () => localStorage.setItem(LS_NAME, nameEl.value));
    wsPathEl.addEventListener("input", () => localStorage.setItem(LS_PATH, wsPathEl.value));

    connectBtn.addEventListener("click", () => {
      // toggle connect/disconnect
      if (ws && ws.readyState === WebSocket.OPEN) {
        disconnect();
        shouldReconnect = true; // allow reconnect if user clicks connect again
        return;
      }
      shouldReconnect = true;
      connect();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = textEl.value.trim();
      if (!text) return;
      sendMessage(text);
      textEl.value = "";
      textEl.focus();
    });

    // Auto connect
    connect();
  }

  init();
})();
