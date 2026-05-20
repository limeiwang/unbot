// Service Worker — handles context menu and API calls

const API_URL = "https://wechat.limw.top/api/optimize";

chrome.runtime.onInstalled.addListener(() => {
  console.log("[bg] Extension installed, creating context menu");
  chrome.contextMenus.create({
    id: "optimize-wechat",
    title: "优化微信体验",
    contexts: ["selection"],
  });
});

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "ping" });
    console.log("[bg] Content script already loaded in tab", tabId);
    return true;
  } catch (e) {
    console.log("[bg] Content script not responding, injecting dynamically into tab", tabId, e.message);
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
      console.log("[bg] Dynamic injection succeeded for tab", tabId);
      return true;
    } catch (e2) {
      console.error("[bg] Dynamic injection FAILED for tab", tabId, e2.message);
      return false;
    }
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "optimize-wechat" || !info.selectionText || !tab?.id) return;

  console.log("[bg] Context menu clicked", {
    tabId: tab.id,
    url: tab.url,
    selectionLength: info.selectionText.length,
    selectionPreview: info.selectionText.slice(0, 50),
  });

  // Ensure content script is running before proceeding
  const injected = await ensureContentScript(tab.id);
  if (!injected) {
    console.error("[bg] Cannot proceed — content script not available");
    chrome.tabs.sendMessage(tab.id, {
      action: "showError",
      error: "无法在此页面注入优化工具（不受支持的页面类型）",
    }).catch((e) => console.error("[bg] sendMessage (fallback error) also failed", e.message));
    return;
  }

  // Small delay to let injected script initialize
  await new Promise(r => setTimeout(r, 100));

  // Show loading state
  console.log("[bg] Sending showLoading to tab", tab.id);
  chrome.tabs.sendMessage(tab.id, { action: "showLoading" }).catch((e) => {
    console.error("[bg] sendMessage (showLoading) failed", e.message);
  });

  try {
    console.log("[bg] Calling API", { textLength: info.selectionText.length });
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: info.selectionText }),
    });

    if (!res.ok) {
      console.error("[bg] API returned error", res.status);
      chrome.tabs.sendMessage(tab.id, { action: "showError", error: `请求失败 (${res.status})` }).catch(() => {});
      return;
    }

    const data = await res.json();
    console.log("[bg] API response", { optimizedLength: data.optimized?.length, blocks: data.blocks });
    chrome.tabs.sendMessage(tab.id, {
      action: "showResult",
      original: info.selectionText,
      optimized: data.optimized,
      originalChars: data.originalChars,
      optimizedChars: data.optimizedChars,
    }).catch((e) => console.error("[bg] sendMessage (showResult) failed", e.message));
  } catch (e) {
    console.error("[bg] Network request failed", e.message);
    chrome.tabs.sendMessage(tab.id, { action: "showError", error: "网络请求失败，请检查网络连接" }).catch(() => {});
  }
});
