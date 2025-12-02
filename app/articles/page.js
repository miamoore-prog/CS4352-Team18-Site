"use client";
import { useState, useMemo } from "react";

export default function ArticlesPage() {
  const [sortBy, setSortBy] = useState("newest");
  const [filterAuthor, setFilterAuthor] = useState("all");

  const articles = [
    {
      title: "Top 10 AI Tools to Try in 2025",
      author: "Forbes",
      link: "https://www.forbes.com/sites/forbestechcouncil/",
      date: "2024-11-28",
      summary:
        "Discover the most innovative AI tools that are set to revolutionize how we work and create in 2025, curated by industry experts.",
    },
    {
      title: "The Future of Generative AI",
      author: "MIT Technology Review",
      link: "https://www.technologyreview.com/",
      date: "2024-11-25",
      summary:
        "An in-depth analysis of where generative AI is heading, covering breakthroughs in text, image, and video generation technologies.",
    },
    {
      title: "AI and Ethics: Balancing Innovation and Responsibility",
      author: "Wired",
      link: "https://www.wired.com/category/ai/",
      date: "2024-11-20",
      summary:
        "A critical examination of the ethical challenges posed by AI development and how organizations can balance progress with responsible innovation.",
    },
    {
      title: "How AI is Revolutionizing Healthcare Diagnostics",
      author: "Nature",
      link: "https://www.nature.com/",
      date: "2024-11-15",
      summary:
        "Learn about cutting-edge AI applications in medical diagnostics that are improving accuracy and enabling earlier disease detection.",
    },
    {
      title: "Understanding the Nuances of Human-Like Intelligence",
      author: "MIT News",
      link: "https://news.mit.edu/2025/understanding-nuances-human-intelligence-phillip-isola-1111",
      date: "2024-11-11",
      summary:
        "MIT researchers explore what it means for AI to achieve human-like intelligence and the technical challenges that remain.",
    },
    {
      title: "Charting the Future of AI, From Safer Answers to Faster Thinking",
      author: "MIT News",
      link: "https://news.mit.edu/2025/charting-the-future-of-ai-from-safer-answers-to-faster-thinking-1106",
      date: "2024-11-06",
      summary:
        "Insights into the next generation of AI systems focused on safety, reliability, and enhanced reasoning capabilities.",
    },
    {
      title:
        "MIT Researchers Propose a New Model for Legible, Modular Software",
      author: "MIT News",
      link: "https://news.mit.edu/2025/mit-researchers-propose-new-model-for-legible-modular-software-1106",
      date: "2024-11-06",
      summary:
        "A groundbreaking approach to software development that makes AI systems more interpretable and easier to maintain.",
    },
    {
      title: "Top 10: AI Leaders",
      author: "AI Magazine",
      link: "https://aimagazine.com/news/what-do-governments-risk-without-smarter-ai-procurement",
      date: "2024-10-30",
      summary:
        "Profiles of the most influential leaders shaping the AI industry and their visions for the technology's future.",
    },
    {
      title:
        "Universities are embracing AI: Will Students Get Smarter or Stop Thinking?",
      author: "Nature",
      link: "https://www.nature.com/articles/d41586-025-03340-w",
      date: "2024-10-25",
      summary:
        "An examination of how AI tools are being integrated into education and the debate over their impact on student learning.",
    },
  ];

  // Get unique authors for filter
  const authors = useMemo(() => {
    const uniqueAuthors = [...new Set(articles.map((a) => a.author))];
    return uniqueAuthors.sort();
  }, []);

  // Filter and sort articles
  const filteredAndSortedArticles = useMemo(() => {
    let result = articles;

    // Apply author filter
    if (filterAuthor !== "all") {
      result = result.filter((article) => article.author === filterAuthor);
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date) - new Date(a.date);
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [filterAuthor, sortBy]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-slate-800">
        Explore AI & Tech Articles
      </h1>

      {/* Filters and Sort Controls */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Filter by Author
          </label>
          <select
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Authors</option>
            {authors.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        <div className="flex items-end">
          <div className="text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
            Showing {filteredAndSortedArticles.length} article
            {filteredAndSortedArticles.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-6">
        {filteredAndSortedArticles.length > 0 ? (
          filteredAndSortedArticles.map((article, index) => (
            <div
              key={index}
              className="card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-semibold text-sky-700 hover:underline flex-1"
                >
                  {article.title}
                </a>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-slate-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>

              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {article.summary}
              </p>

              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>{article.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formatDate(article.date)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <p className="text-slate-500">
              No articles found matching your criteria.
            </p>
            {filterAuthor !== "all" && (
              <button
                onClick={() => {
                  setFilterAuthor("all");
                }}
                className="mt-4 text-sky-600 hover:text-sky-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
