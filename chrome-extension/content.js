// Content script — manages the floating tooltip

console.log("[cs] Content script loaded");

let tooltip = null;

function createTooltip() {
  console.log("[cs] createTooltip called");
  if (tooltip && tooltip.parentNode) {
    console.log("[cs] Removing existing tooltip");
    document.body.removeChild(tooltip);
  }

  tooltip = document.createElement("unbot-root");
  tooltip.style.cssText = `
    all: initial;
    position: fixed;
    z-index: 2147483647;
    width: 380px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #1a1a1a;
  `;

  tooltip.innerHTML = `
    <div id="unbot-header" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f0f0f0">
      <span style="font-size:13px;font-weight:600;color:#07c160">Unbot</span>
      <button id="unbot-close" style="all:initial;cursor:pointer;font-size:20px;line-height:1;color:#999;padding:2px 6px;border-radius:4px">&times;</button>
    </div>
    <div id="unbot-body" style="padding:16px;max-height:360px;overflow-y:auto">
      <div id="unbot-loading" style="display:none;align-items:center;gap:10px;justify-content:center;padding:24px;color:#999;font-size:13px">
        <div style="width:18px;height:18px;border:2px solid #e5e7eb;border-top:2px solid #07c160;border-radius:50%"></div>
        <span>优化中...</span>
      </div>
      <div id="unbot-result" style="display:none">
        <div id="unbot-text" style="font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap;word-break:break-word;background:#f8fff5;border-radius:8px;padding:12px;margin-bottom:12px;border-left:3px solid #07c160"></div>
        <div id="unbot-stats" style="font-size:11px;color:#999;margin-bottom:12px;font-family:monospace"></div>
        <div id="unbot-actions" style="display:flex;gap:8px">
          <button id="unbot-replace" class="unbot-btn" style="all:initial;cursor:pointer;flex:1;text-align:center;padding:8px 0;border-radius:8px;font-size:13px;font-weight:500;background:#07c160;color:#fff">替换</button>
          <button id="unbot-copy" class="unbot-btn" style="all:initial;cursor:pointer;flex:1;text-align:center;padding:8px 0;border-radius:8px;font-size:13px;font-weight:500;background:#f0f0f0;color:#333">复制</button>
        </div>
      </div>
      <div id="unbot-error" style="display:none;color:#e53e3e;font-size:13px;text-align:center;padding:16px"></div>
    </div>
  `;

  console.log("[cs] Appending tooltip to body");
  tooltip.style.left = Math.max(8, (window.innerWidth - 380) / 2) + "px";
  tooltip.style.top = "60px";
  try {
    document.body.appendChild(tooltip);
    console.log("[cs] Tooltip appended successfully");
  } catch (e) {
    console.error("[cs] Failed to append tooltip", e.message);
  }

  // Events
  document.getElementById("unbot-close").onclick = hideTooltip;
  document.getElementById("unbot-replace").onclick = () => replaceSelection();
  document.getElementById("unbot-copy").onclick = () => copyResult();

  return tooltip;
}

function positionTooltip() {
  const sel = window.getSelection();
  const has = `sel=${!!sel} rangeCount=${sel?.rangeCount} hasTooltip=${!!tooltip}`;
  console.log("[cs] positionTooltip", has);

  if (!tooltip) return;

  if (!sel || !sel.rangeCount) {
    console.log("[cs] No valid selection, centering tooltip in viewport");
    centerTooltip();
    return;
  }

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  console.log("[cs] Selection rect", `x=${rect.x} y=${rect.y} w=${rect.width} h=${rect.height}`);

  // If selection rect is at (0,0) with zero size, selection was likely lost
  if (rect.width === 0 && rect.height === 0 && rect.left === 0 && rect.top === 0) {
    console.log("[cs] Selection rect is empty, centering tooltip");
    centerTooltip();
    return;
  }

  const tooltipWidth = 380;
  const gap = 8;

  // rect is viewport-relative (getBoundingClientRect), tooltip is position:fixed
  // so NO scroll offset — both are viewport-relative
  let left = rect.left;
  let top = rect.bottom + gap;

  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - gap;
  }
  if (left < 0) left = gap;

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
  console.log("[cs] Tooltip positioned at", `left=${left} top=${top}`);
}

function centerTooltip() {
  if (!tooltip) return;
  const left = Math.max(8, (window.innerWidth - 380) / 2);
  const top = Math.max(8, 60);
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
  console.log("[cs] Tooltip centered at", `left=${left} top=${top}`);
}

function hideTooltip() {
  console.log("[cs] hideTooltip");
  if (tooltip && tooltip.parentNode) {
    document.body.removeChild(tooltip);
  }
  tooltip = null;
}

function replaceSelection() {
  const optimized = document.getElementById("unbot-text")?.textContent;
  if (!optimized) return;

  const sel = window.getSelection();
  if (sel && sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(optimized));
    sel.removeAllRanges();
  }
  hideTooltip();
}

function copyResult() {
  const optimized = document.getElementById("unbot-text")?.textContent;
  if (!optimized) return;

  navigator.clipboard.writeText(optimized).then(() => {
    const btn = document.getElementById("unbot-copy");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "已复制!";
      setTimeout(() => { btn.textContent = orig; }, 1500);
    }
  });
}

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[cs] Message received", msg.action, msg);

  if (msg.action === "ping") {
    sendResponse({ ok: true });
    return;
  }

  if (!tooltip) {
    console.log("[cs] Creating tooltip on first message");
    createTooltip();
  }

  switch (msg.action) {
    case "showLoading":
      document.getElementById("unbot-loading").style.display = "flex";
      document.getElementById("unbot-result").style.display = "none";
      document.getElementById("unbot-error").style.display = "none";
      positionTooltip();
      break;

    case "showResult":
      document.getElementById("unbot-loading").style.display = "none";
      document.getElementById("unbot-error").style.display = "none";
      document.getElementById("unbot-text").textContent = msg.optimized;
      document.getElementById("unbot-stats").textContent =
        `${msg.originalChars} 字 → ${msg.optimizedChars} 字 (${Math.round((1 - msg.optimizedChars / msg.originalChars) * 100)}%)`;
      document.getElementById("unbot-result").style.display = "block";
      positionTooltip();
      break;

    case "showError":
      document.getElementById("unbot-loading").style.display = "none";
      document.getElementById("unbot-result").style.display = "none";
      document.getElementById("unbot-error").textContent = msg.error;
      document.getElementById("unbot-error").style.display = "block";
      positionTooltip();
      break;
  }
});
