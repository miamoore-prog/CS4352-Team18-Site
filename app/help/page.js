"use client";

import { useState } from "react";
import { Card } from "../../components/ui";

export default function HelpPage() {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const faqs = [
    {
      id: "what-is",
      question: "What is AI Compass?",
      answer:
        "AI Compass is a comprehensive directory and community platform for discovering, reviewing, and discussing AI tools. We help you find the right AI tool for your specific needs, whether it's for writing, coding, image generation, or automation.",
    },
    {
      id: "how-search",
      question: "How do I search for AI tools?",
      answer:
        "Use the search bar on the Tools page to search by tool name, category, or feature. You can also browse by tags or use our AI-powered search to describe what you want to accomplish (e.g., 'write email' or 'create an image').",
    },
    {
      id: "bookmark",
      question: "How do I bookmark tools?",
      answer:
        "Click the bookmark icon (☆) on any tool card or within the tool details modal. Your bookmarked tools are saved to your account and can be accessed from your profile menu under 'Manage Profile'.",
    },
    {
      id: "review",
      question: "How do I review a tool?",
      answer:
        "Open any tool's details by clicking on it, then scroll down to the 'Your review' section. You can add a star rating (1-5 stars) and write a text review. Your reviews help other users make informed decisions.",
    },
    {
      id: "community",
      question: "What is the Community section?",
      answer:
        "The Community section is where users can create discussion threads, ask questions, share tips, and engage with other AI tool users. You can comment on threads, like posts and comments, and search for specific topics.",
    },
    {
      id: "create-post",
      question: "How do I create a community post?",
      answer:
        "Click the purple '+' button in the bottom-right corner of the Community page. You can write a title, select a related tool (optional), and write your post content. Your post will appear in the community feed.",
    },
    {
      id: "admin",
      question: "What can admins do?",
      answer:
        "Admins can manage tools (add, edit, hide), moderate community content (flag/delete posts and comments), and review tool requests from users. Admin functions are accessible from the profile dropdown menu.",
    },
    {
      id: "request-tool",
      question: "How do I request a new tool?",
      answer:
        "If you're logged in as a regular user, go to your profile menu and select 'Request tool'. Fill out the form with the tool name, description, and your contact info. Admins will review your request.",
    },
    {
      id: "language",
      question: "Can I use AI Compass in different languages?",
      answer:
        "Yes! Click the 'Language' button in the top navigation bar to access Google Translate. You can translate the entire site into English, Chinese, Vietnamese, Spanish, or Yoruba.",
    },
    {
      id: "account",
      question: "How do I manage my account?",
      answer:
        "Click on your profile icon in the top-right corner and select 'Manage Profile'. Here you can update your display name and view your bookmarked tools.",
    },
  ];

  const guides = [
    {
      id: "getting-started",
      title: "Getting Started",
      steps: [
        "Sign in using the Login button (use demo credentials: alice/test)",
        "Browse the Tools page to discover AI tools",
        "Click on any tool to view detailed information",
        "Bookmark your favorite tools for quick access",
        "Leave reviews to help other users",
      ],
    },
    {
      id: "finding-tools",
      title: "Finding the Right Tool",
      steps: [
        "Use the search bar to describe your task",
        "Filter by categories using tags",
        "Read reviews and ratings from other users",
        "Check the 'Quick Summary' for each tool",
        "Click 'How to guide' for usage instructions",
      ],
    },
    {
      id: "community-engagement",
      title: "Engaging with the Community",
      steps: [
        "Navigate to the Community page",
        "Browse existing discussions or use search",
        "Click the '+' button to create a new post",
        "Comment on threads to join conversations",
        "Like posts and comments you find helpful",
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Help & Documentation</h1>
        <p className="mt-2 text-slate-600">
          Everything you need to know about using AI Compass
        </p>
      </div>

      {/* Quick Start Guides */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Quick Start Guides</h2>
        <div className="space-y-4">
          {guides.map((guide) => (
            <div key={guide.id} className="border-b border-slate-200 last:border-0 pb-4 last:pb-0">
              <h3 className="font-semibold text-slate-800 mb-2">{guide.title}</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
                {guide.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Card>

      {/* FAQs */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-800">{faq.question}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 text-slate-500 transition-transform ${
                    openSection === faq.id ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openSection === faq.id && (
                <div className="px-4 pb-4 text-sm text-slate-600 border-t border-slate-100 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Contact & Support */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Need More Help?</h2>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <strong className="text-slate-800">Still have questions?</strong> Browse our community
            discussions or create a post asking for help from other users.
          </p>
          <p>
            <strong className="text-slate-800">Found a bug?</strong> Please report it through the
            community with details about what happened and how to reproduce it.
          </p>
          <p>
            <strong className="text-slate-800">Feature request?</strong> We'd love to hear your ideas!
            Share them in the community and discuss with other users.
          </p>
        </div>
      </Card>

      {/* Tips & Best Practices */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Tips & Best Practices</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">Write detailed reviews:</strong> Help others by
              sharing specific use cases, pros, and cons of the tools you've tried.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">Use descriptive search terms:</strong> Instead of
              just tool names, try describing what you want to accomplish.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">Engage respectfully:</strong> Keep community
              discussions constructive and helpful for everyone.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">Check tool details:</strong> Before using a tool,
              review its summary, pricing, and how-to guide to ensure it meets your needs.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">Bookmark strategically:</strong> Save tools you use
              frequently for quick access from your profile.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
