"use client";

import { useState, useEffect } from "react";
import { Card } from "../../components/ui";

export default function HelpPage() {
  const [openSection, setOpenSection] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || null);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

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

  const adminFaqs = [
    {
      id: "admin-access",
      question: "How do I access admin features?",
      answer:
        "Log in with admin credentials (admin/adminpass). The homepage will automatically display the Admin Dashboard with quick access to Manage Tools, Manage Community, and Tool Requests. You can also access these features from the profile dropdown menu.",
    },
    {
      id: "admin-hide-vs-delete",
      question: "Should I hide or delete a tool?",
      answer:
        "Always prefer hiding tools over deletion. Hiding preserves the tool's data (reviews, ratings, bookmarks) while removing it from public view. This allows you to restore the tool later if needed. Only delete if the tool was added by mistake or contains harmful content.",
    },
    {
      id: "admin-tool-fields",
      question: "Which fields are required when adding a tool?",
      answer:
        "Required fields include: Tool Name, Description, URL, Category, Tags, Pricing Type, Quick Summary, How-to Guide, and Use Cases. Ensure all fields are filled accurately to provide users with complete information.",
    },
    {
      id: "admin-moderate-content",
      question: "When should I flag vs. delete community content?",
      answer:
        "Use flagging to mark questionable content for review - it remains visible but is marked. Use deletion for content that clearly violates community guidelines: spam, harassment, explicit content, or misinformation. Deleted posts and comments are permanently removed.",
    },
    {
      id: "admin-tool-requests",
      question: "How should I handle tool requests?",
      answer:
        "Review each request for completeness and relevance. If approved, add the tool through 'Manage Tools' using the provided information. Dismiss requests that are duplicates, incomplete, or not relevant to the platform. Consider contacting users if clarification is needed.",
    },
    {
      id: "admin-user-reviews",
      question: "Can I edit or delete user reviews?",
      answer:
        "Currently, admin controls focus on tool and community management. User reviews are tied to tools and cannot be individually edited. If a review violates guidelines, you can hide the entire tool temporarily while addressing the issue.",
    },
    {
      id: "admin-dashboard-navigation",
      question: "How do I view the regular user experience?",
      answer:
        "As an admin, your homepage shows the Admin Dashboard. To see the regular user view, navigate directly to /tools or /community pages. You can also log in with a regular user account (e.g., alice/test) to experience the platform as a standard user.",
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

  const adminGuides = [
    {
      id: "admin-dashboard",
      title: "Accessing the Admin Dashboard",
      steps: [
        "Log in with admin credentials (admin/adminpass)",
        "Navigate to the homepage - you'll see the Admin Dashboard instead of the landing page",
        "The dashboard provides three main sections: Manage Tools, Manage Community, and Tool Requests",
        "Click on any card to access the respective admin function",
      ],
    },
    {
      id: "managing-tools",
      title: "Managing AI Tools",
      steps: [
        "From the Admin Dashboard, click 'Manage Tools' or navigate to /tools/admin",
        "View the complete list of all tools in the database with their status (visible/hidden)",
        "To ADD a new tool: Click 'Add New Tool' button at the top",
        "Fill in all required fields: name, description, URL, category, tags, pricing, and detailed information",
        "To EDIT a tool: Click the 'Edit' button next to any tool in the list",
        "Update the desired fields and click 'Save changes'",
        "To HIDE/SHOW a tool: Click the 'Hide' or 'Show' button to toggle visibility for regular users",
        "Hidden tools won't appear in search results or browse pages for non-admin users",
      ],
    },
    {
      id: "managing-community",
      title: "Moderating Community Content",
      steps: [
        "Navigate to the Community page from the Admin Dashboard",
        "Browse posts and comments as normal",
        "To FLAG inappropriate content: Click the flag icon (⚑) on any post or comment",
        "Flagged items are marked for review but remain visible",
        "To DELETE content: Click the delete/trash icon on any post or comment",
        "Deleted posts remove the entire thread and all associated comments",
        "Deleted comments are removed immediately",
        "Monitor community discussions regularly to maintain a respectful environment",
      ],
    },
    {
      id: "tool-requests",
      title: "Reviewing Tool Requests",
      steps: [
        "From the Admin Dashboard, click 'Tool Requests' or navigate to /tools/requests/admin",
        "View all pending requests submitted by users",
        "Each request shows: tool name, description, and user contact information",
        "Review the request details to determine if the tool should be added",
        "To APPROVE: Use the information to add the tool via 'Manage Tools'",
        "To DISMISS: Click the 'Dismiss' button to remove the request from the list",
        "You can contact users via the provided email for clarification if needed",
      ],
    },
    {
      id: "admin-best-practices",
      title: "Admin Best Practices",
      steps: [
        "Regularly check tool requests to keep users engaged",
        "Hide tools rather than delete them to preserve data",
        "Review flagged content promptly to maintain community standards",
        "When adding tools, ensure all fields are complete and accurate",
        "Keep tool information up-to-date, especially pricing and availability",
        "Monitor community for spam and inappropriate behavior",
        "Use the homepage dashboard for quick access to frequently used functions",
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Help & Documentation
        </h1>
        <p className="mt-2 text-slate-600">
          Everything you need to know about using AI Compass
        </p>
      </div>

      {/* Quick Start Guides */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Quick Start Guides</h2>
        <div className="space-y-4">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="border-b border-slate-200 last:border-0 pb-4 last:pb-0"
            >
              <h3 className="font-semibold text-slate-800 mb-2">
                {guide.title}
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
                {guide.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Card>

      {/* Admin Guides - Only visible to admins */}
      {user && user.role === "admin" && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-sky-600 text-white px-3 py-1 rounded-lg font-semibold text-xs">
              ADMIN
            </div>
            <h2 className="text-xl font-semibold">Administrator Guides</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Comprehensive guides for admin functionality and platform
            management.
          </p>
          <div className="space-y-4">
            {adminGuides.map((guide) => (
              <div
                key={guide.id}
                className="border-b border-slate-200 last:border-0 pb-4 last:pb-0"
              >
                <h3 className="font-semibold text-slate-800 mb-2">
                  {guide.title}
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
                  {guide.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* FAQs */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-800">
                  {faq.question}
                </span>
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

      {/* Admin FAQs - Only visible to admins */}
      {user && user.role === "admin" && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-sky-600 text-white px-3 py-1 rounded-lg font-semibold text-xs">
              ADMIN
            </div>
            <h2 className="text-xl font-semibold">Admin FAQs</h2>
          </div>
          <div className="space-y-2">
            {adminFaqs.map((faq) => (
              <div
                key={faq.id}
                className="border border-sky-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-sky-50 transition-colors"
                >
                  <span className="font-medium text-slate-800">
                    {faq.question}
                  </span>
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
                  <div className="px-4 pb-4 text-sm text-slate-600 border-t border-sky-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contact & Support */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Need More Help?</h2>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <strong className="text-slate-800">Still have questions?</strong>{" "}
            Browse our community discussions or create a post asking for help
            from other users.
          </p>
          <p>
            <strong className="text-slate-800">Found a bug?</strong> Please
            report it through the community with details about what happened and
            how to reproduce it.
          </p>
          <p>
            <strong className="text-slate-800">Feature request?</strong> We'd
            love to hear your ideas! Share them in the community and discuss
            with other users.
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
              <strong className="text-slate-800">
                Write detailed reviews:
              </strong>{" "}
              Help others by sharing specific use cases, pros, and cons of the
              tools you've tried.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">
                Use descriptive search terms:
              </strong>{" "}
              Instead of just tool names, try describing what you want to
              accomplish.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">Engage respectfully:</strong>{" "}
              Keep community discussions constructive and helpful for everyone.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">Check tool details:</strong>{" "}
              Before using a tool, review its summary, pricing, and how-to guide
              to ensure it meets your needs.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>
              <strong className="text-slate-800">
                Bookmark strategically:
              </strong>{" "}
              Save tools you use frequently for quick access from your profile.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
