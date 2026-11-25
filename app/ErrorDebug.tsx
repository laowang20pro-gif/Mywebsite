
"use client";

import { useEffect, useState } from "react";

export default function ErrorDebug() {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const addError = (message: string) => {
      setErrors((old) => [...old, message].slice(-10));
    };

    const onError = (event: ErrorEvent) => {
      addError(
        "JS错误: " +
        event.message +
        "\n文件: " +
        event.filename +
        "\n位置: " +
        event.lineno +
        ":" +
        event.colno
      );
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      addError(
        "Promise错误: " +
        (reason?.stack || reason?.message || String(reason))
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!errors.length) return null;

  return (
    <div style={{
      position: "fixed",
      zIndex: 999999,
      inset: "0",
      background: "#240000",
      color: "#fff",
      padding: "15px",
      overflow: "auto",
      fontSize: "13px",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all"
    }}>
      <h2>网站错误诊断</h2>
      {errors.map((error, index) => (
        <pre key={index} style={{
          borderBottom: "1px solid #888",
          padding: "10px 0"
        }}>
          {error}
        </pre>
      ))}
    </div>
  );
}
