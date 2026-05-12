(function () {
  "use strict";

  var script = document.currentScript;
  var chatbotUid = script ? script.getAttribute("data-chatbot-uid") : null;
  if (!chatbotUid) {
    console.error("[SmartSupport] Missing data-chatbot-uid attribute on script tag.");
    return;
  }

  var baseUrl = script
    ? script.src.replace(/\/widget\.js.*$/, "")
    : window.location.origin;

  var sessionId =
    (function () {
      try {
        var key = "ss_session_" + chatbotUid;
        var existing = sessionStorage.getItem(key);
        if (existing) return existing;
        var id = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(key, id);
        return id;
      } catch (e) {
        return "sess_" + Math.random().toString(36).slice(2);
      }
    })();

  var styles = `
    #ss-widget-btn {
      position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
      background: #2563eb; border-radius: 50%; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(37,99,235,0.4); z-index: 999998;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #ss-widget-btn:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(37,99,235,0.5); }
    #ss-widget-btn svg { width: 26px; height: 26px; fill: #fff; }
    #ss-widget-frame {
      position: fixed; bottom: 90px; right: 24px; width: 370px; height: 520px;
      border: none; border-radius: 16px; z-index: 999999;
      box-shadow: 0 8px 40px rgba(0,0,0,0.22);
      transition: opacity 0.25s, transform 0.25s;
    }
    #ss-widget-frame.ss-hidden { opacity: 0; pointer-events: none; transform: translateY(12px) scale(0.97); }
    @media (max-width: 480px) {
      #ss-widget-frame { right: 0; bottom: 70px; width: 100vw; height: 70vh; border-radius: 16px 16px 0 0; }
    }
  `;

  var styleEl = document.createElement("style");
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  var btn = document.createElement("button");
  btn.id = "ss-widget-btn";
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
  document.body.appendChild(btn);

  var frame = document.createElement("iframe");
  frame.id = "ss-widget-frame";
  frame.className = "ss-hidden";
  frame.src =
    baseUrl + "/widget/" + encodeURIComponent(chatbotUid) + "?session=" + encodeURIComponent(sessionId);
  frame.allow = "microphone";
  document.body.appendChild(frame);

  var isOpen = false;
  btn.addEventListener("click", function () {
    isOpen = !isOpen;
    if (isOpen) {
      frame.classList.remove("ss-hidden");
      btn.setAttribute("aria-label", "Close chat");
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    } else {
      frame.classList.add("ss-hidden");
      btn.setAttribute("aria-label", "Open chat");
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
    }
  });
})();
