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
      const element = document.getElementById("google_translate_element");
      if (element && window.google?.translate && !isInitialized) {
        // Clear any existing content
        element.innerHTML = "";
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,zh,vi,es,yo",
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true,
            },
            "google_translate_element"
          );

          // Replace "Select Language" with "English" only
          const replaceSelectLanguage = () => {
            const menuValue = element.querySelector('.goog-te-menu-value span');
            if (menuValue && menuValue.textContent.trim() === 'Select Language') {
              menuValue.textContent = 'English';
            }
          };

          // Initial replacement after a delay
          setTimeout(replaceSelectLanguage, 500);

          // Watch for changes and replace "Select Language" if it appears again
          const observer = new MutationObserver(() => {
            const menuValue = element.querySelector('.goog-te-menu-value span');
            if (menuValue && menuValue.textContent.trim() === 'Select Language') {
              menuValue.textContent = 'English';
            }
          });

          // Start observing
          const gadget = element.querySelector('.goog-te-gadget');
          if (gadget) {
            observer.observe(gadget, {
              childList: true,
              subtree: true,
              characterData: true
            });
          }

          setIsInitialized(true);
          console.log("Google Translate initialized successfully");
        } catch (e) {
          console.error("Error initializing Google Translate:", e);
        }
      }
    };

    // If already exists, initialize
    if (window.google?.translate?.TranslateElement) {
      initTranslate();
      return;
    }

    // Check if script already exists
    if (document.getElementById(scriptId)) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.translate) {
          clearInterval(checkInterval);
          initTranslate();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Define initialization callback
    window.googleTranslateElementInit = function() {
      console.log("googleTranslateElementInit called");
      initTranslate();
    };

    // Add the script
    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "text/javascript";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.onerror = () => console.error("Failed to load Google Translate script");
    document.getElementsByTagName("head")[0].appendChild(script);
  }, [mounted, isInitialized]);

  if (!mounted) return null;

  return (
    <div
      className="absolute top-full mt-2 right-0 z-50 transition-all"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        visibility: visible ? 'visible' : 'hidden'
      }}
    >
      <div
        id="google_translate_element"
        className="bg-white shadow-lg border border-slate-200 p-3 rounded-lg"
        style={{
          fontFamily: 'inherit'
        }}
      ></div>
    </div>
  );
}
