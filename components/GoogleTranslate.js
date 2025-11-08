"use client";

import { useEffect } from "react";

export default function GoogleTranslate({ visible }) {
  useEffect(() => {
    if (!visible) return; // only load when visible

    const scriptId = "google-translate-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,zh,vi,es,yo",
            layout:
              window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
      };
    }
  }, [visible]);

  if (!visible) return null; // don’t render anything if hidden

  return (
    <div
      id="google_translate_element"
      className="absolute top-12 right-0 z-50 bg-white shadow-md p-2 rounded-md"
    ></div>
  );
}
