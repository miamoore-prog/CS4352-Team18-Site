import "../styles/globals.css";
import NavBar from "../components/NavBar";
import { AuthProvider } from "../components/AuthContext";
import { BookmarkProvider } from "../components/BookmarkContext";

export const metadata = {
  title: "AI Tools Browser",
  description: "Find friendly, simple AI tools for common tasks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <BookmarkProvider>
            <div className="max-w-5xl mx-auto px-4 py-8">
              <header className="mb-8">
                <NavBar />
              </header>

              <main>{children}</main>

              <footer className="mt-12 text-sm text-slate-500">
                Built by Team 18 for CS/CGS 4352 (Introduction to Human-Computer
                Interaction)
              </footer>
            </div>
          </BookmarkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
