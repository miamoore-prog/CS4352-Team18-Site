import '../styles/globals.css'

export const metadata = {
  title: 'AI Tools Browser',
  description: 'Find friendly, simple AI tools for common tasks.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">AI Tools — Simple Finder</h1>
                <p className="text-sm text-slate-500">Find the right AI tool for the job — fast and simple.</p>
              </div>
              <div className="text-xs text-slate-400">Minimal • Friendly • Clear</div>
            </div>
          </header>

          <main>{children}</main>

          <footer className="mt-12 text-sm text-slate-500">Made for non-technical users • Example data only</footer>
        </div>
      </body>
    </html>
  )
}
