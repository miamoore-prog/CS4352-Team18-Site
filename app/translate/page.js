"use client"; // <-- This line is crucial for Next.js App Router (enables client-side only)

import { useEffect, useState } from "react";

export default function TranslateButton() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Avoid SSR issues — only run in browser
    if (typeof window === "undefined") return;

    // If Google Translate script not yet added, add it
    if (!document.querySelector("#google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    // Define callback globally before the script loads
    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "vi,zh-CN,ja,fr,es",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
        setReady(true);
      }
    };
  }, []);

  const handleTranslate = (lang) => {
    const dropdown = document.querySelector(".goog-te-combo");
    if (dropdown) {
      dropdown.value = lang;
      dropdown.dispatchEvent(new Event("change"));
    } else {
      alert("Google Translate not ready yet — please wait a moment.");
    }
  };

  return (
    <div>
      {/* Hidden Google container (used internally by the script) */}
      <div id="google_translate_element" style={{ display: "none" }}></div>

      {/* Your own buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTranslate("zh-CN")}
          disabled={!ready}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          中文
        </button>
        <button
          onClick={() => handleTranslate("vi")}
          disabled={!ready}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Tiếng Việt
        </button>
        <button
          onClick={() => handleTranslate("en")}
          disabled={!ready}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          English
        </button>

        <button
          onClick={() => handleTranslate("ja")}
          disabled={!ready}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Spanish
        </button>

        <button
          onClick={() => handleTranslate("fr")}
          disabled={!ready}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Youruba
        </button>




      </div>
    </div>
  );
}
