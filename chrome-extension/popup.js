// Check server status
(async function () {
  const dot = document.getElementById("status-dot");
  const text = document.getElementById("status-text");

  try {
    const res = await fetch("https://unbot.limw.top/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "ping" }),
    });
    if (res.ok) {
      dot.className = "status-dot online";
      text.textContent = "服务器在线";
    } else {
      dot.className = "status-dot offline";
      text.textContent = `服务器异常 (${res.status})`;
    }
  } catch {
    dot.className = "status-dot offline";
    text.textContent = "无法连接服务器";
  }
})();
