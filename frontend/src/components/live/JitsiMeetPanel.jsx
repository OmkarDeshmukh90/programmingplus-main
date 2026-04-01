import React, { useEffect, useRef } from "react";

const JITSI_DOMAIN = "meet.jit.si";
const JITSI_SCRIPT_SRC = "https://meet.jit.si/external_api.js";

const loadJitsiScript = () =>
  new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${JITSI_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = JITSI_SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

export default function JitsiMeetPanel({ sessionId, displayName }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!sessionId || !containerRef.current) return;
    let disposed = false;

    loadJitsiScript()
      .then(() => {
        if (disposed || !window.JitsiMeetExternalAPI) return;
        const roomName = `interview_session_${sessionId}`;
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ["microphone", "camera", "desktop", "tileview", "chat", "hangup"],
          },
        });
        if (displayName) {
          apiRef.current.executeCommand("displayName", displayName);
        }
      })
      .catch(() => {});

    return () => {
      disposed = true;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [sessionId, displayName]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
      <div className="text-xs text-slate-400 mb-2">Video Interview</div>
      <div ref={containerRef} className="w-full h-80 rounded-lg overflow-hidden bg-black" />
    </div>
  );
}
