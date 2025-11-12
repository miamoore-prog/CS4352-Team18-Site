"use client";
import { useState } from "react";

export default function ArticlesPage() {
  const [search, setSearch] = useState("");
  const articles = [
    {
      title: "How AI Is Transforming the Workplace",
      author: "TechRadar",
      link: "https://www.techradar.com/pro/ai-transforming-the-workplace",
    },
    {
      title: "Top 10 AI Tools to Try in 2025",
      author: "Forbes",
      link: "https://www.forbes.com/sites/forbestechcouncil/",
    },
    {
      title: "The Future of Generative AI",
      author: "MIT Technology Review",
      link: "https://www.technologyreview.com/",
    },
    {
      title: "AI and Ethics: Balancing Innovation and Responsibility",
      author: "Wired",
      link: "https://www.wired.com/category/ai/",
    },
    {
      title: "How AI is Revolutionizing Healthcare Diagnostics",
      author: "Nature",
      link: "https://www.nature.com/",
    },
  ];

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-slate-800">
        Explore AI & Tech Articles
      </h1>

      <input
        type="text"
        placeholder="Search by topic or author..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-gray-300 rounded-lg p-3 w-full mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      <div className="space-y-4">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article, index) => (
            <div
              key={index}
              className="p-5 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-semibold text-purple-700 hover:underline"
              >
                {article.title}
              </a>
              <p className="text-sm text-gray-600 mt-1">By {article.author}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">
            No articles found for “{search}”.
          </p>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center mt-8">
        Built by Team 18 for CS/CGS 4352 – Introduction to Human-Computer
        Interaction. <br />
      </p>
    </div>
  );
}
