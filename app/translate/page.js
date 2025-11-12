"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

export default function Page() {
  return (
    <main className="p-8">
      <h1>Click on the language you understand</h1>
      <p>
        Click on the language you can read in! Below we have a few buttons you
        can choose, but there are more languages available in the dropdown once
        you click a button.
      </p>
      <TranslateWidget />
    </main>
  );
}

function TranslateWidget() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      console.log("Google Translate Successful");
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "vi,zh-CN,ja,fr,es",
            layout:
              window.google.translate.TranslateElement.InlineLayout.SIMPLE,
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
    <div className="p-4 bg-gray-100 rounded-md inline-block">
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />

      <h2 className="text-lg font-semibold mb-2">Translate Page:</h2>

      <div id="google_translate_element" style={{ display: "none" }}></div>

      <div className="flex gap-2 flex-wrap mt-2">
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
      </div>
    </div>
  );
}
