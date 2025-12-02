"use client";

import { useEffect, useState } from "react";

export default function GoogleTranslate({ visible }) {
  const [mounted, setMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const scriptId = "google-translate-script";

    const initTranslate = () => {
      console.log("Test");
      const element = document.getElementById("google_translate_element");
      if (element && window.google?.translate && !isInitialized) {
        // Clear any existing content
        element.innerHTML = "";
        try {
          function setCookie(key, value, expiry) {
            var expires = new Date();
            expires.setTime(expires.getTime() + expiry * 24 * 60 * 60 * 1000);
            document.cookie =
              key + "=" + value + ";expires=" + expires.toUTCString();
          }

          setCookie("googtrans", "/en/en", 1);

          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,zh,vi,es,yo",
              layout:
                window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true,
            },
            "google_translate_element"
          );

          const replaceSelectLanguage = () => {
            const menuValue = element.querySelector(".goog-te-menu-value span");
            const text = menuValue?.textContent.trim();
            if (
              menuValue &&
              (text === "Select Language" || text === "Select a Language")
            ) {
              menuValue.textContent = "English";
              return true;
            }
            return false;
          };

          // Try multiple times with polling to catch the element as soon as it loads
          let attempts = 0;
          const maxAttempts = 30;
          const pollInterval = setInterval(() => {
            if (replaceSelectLanguage() || attempts >= maxAttempts) {
              clearInterval(pollInterval);
            }
            attempts++;
          }, 100);

          // Observe for any future changes
          const observer = new MutationObserver(() => {
            replaceSelectLanguage();
          });

          // Observe both the element and the gadget
          observer.observe(element, {
            childList: true,
            subtree: true,
            characterData: true,
          });

          const gadget = element.querySelector(".goog-te-gadget");
          if (gadget) {
            observer.observe(gadget, {
              childList: true,
              subtree: true,
              characterData: true,
            });
          }

          setIsInitialized(true);
        } catch (e) {
          return;
        }
      }
    };

    if (window.google?.translate?.TranslateElement) {
      initTranslate();
      return;
    }

    if (document.getElementById(scriptId)) {
      const checkInterval = setInterval(() => {
        if (window.google?.translate) {
          clearInterval(checkInterval);
          initTranslate();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    window.googleTranslateElementInit = function () {
      initTranslate();
    };

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "text/javascript";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.getElementsByTagName("head")[0].appendChild(script);
  }, [mounted, isInitialized]);

  if (!mounted) return null;

  return (
    <div
      className="absolute top-full mt-2 right-0 z-50 transition-all"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <div
        id="google_translate_element"
        className="bg-white shadow-lg border border-slate-200 p-3 rounded-lg"
        style={{
          fontFamily: "inherit",
        }}
      ></div>
    </div>
  );
}
