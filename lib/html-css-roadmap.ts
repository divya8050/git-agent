/**
 * 180-Day HTML5 & Modern CSS Roadmap (From Scratch to Advanced UI Design)
 */

export interface HtmlCssRoadmapDay {
  day: number;
  stage: string;
  stageFolder: string;
  topic: string;
  slug: string;
  files: {
    html: string;
    css: string;
  };
}

export const HTML_CSS_ROADMAP: HtmlCssRoadmapDay[] = [
  {
    day: 1,
    stage: '01-html5-semantic-foundations',
    stageFolder: '01-html5-semantics',
    topic: 'Semantic HTML5 Document Structure',
    slug: '01-semantic-document-structure',
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 1 - Semantic HTML5 Structure</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Site Header -->
  <header class="site-header">
    <div class="logo">
      <h1>DevNotes</h1>
    </div>
    <nav class="nav-links">
      <a href="#home">Home</a>
      <a href="#articles">Articles</a>
      <a href="#about">About</a>
    </nav>
  </header>

  <!-- Main Content Area -->
  <main class="main-container">
    <article class="primary-post">
      <header class="post-header">
        <h2>Starting My Web Development Journey</h2>
        <p class="post-meta">Published on September 28, 2026 by Divya</p>
      </header>
      <section class="post-content">
        <p>Today marks Day 1 of practicing semantic HTML5 and modern CSS from scratch.</p>
        <p>Using semantic elements like header, main, article, and section improves accessibility and SEO.</p>
      </section>
    </article>

    <!-- Sidebar Aside -->
    <aside class="sidebar">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="#html">HTML5 Living Standard</a></li>
        <li><a href="#css">CSS3 Modern Layouts</a></li>
      </ul>
    </aside>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <p>&copy; 2026 Divya. Daily Practice & Learning.</p>
  </footer>
</body>
</html>
`,
      css: `/* Basic reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8fafc;
  padding: 20px;
}

/* Header styles */
.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 2rem;
}

.nav-links a {
  margin-left: 1.5rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.nav-links a:hover {
  text-decoration: underline;
}

/* Main layout */
.main-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.primary-post {
  background: #ffffff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.post-meta {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.sidebar {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  height: fit-content;
}

.sidebar ul {
  list-style: none;
  margin-top: 0.5rem;
}

.sidebar a {
  color: #0284c7;
  text-decoration: none;
}

.site-footer {
  margin-top: 3rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}
`
    }
  },
  {
    day: 2,
    stage: '01-html5-semantic-foundations',
    stageFolder: '01-html5-semantics',
    topic: 'Accessible Web Forms and Inputs',
    slug: '02-accessible-web-forms',
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 2 - Accessible Forms</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="form-wrapper">
    <h2>User Registration</h2>
    <form action="#" method="POST" class="styled-form">
      <div class="form-group">
        <label for="fullName">Full Name</label>
        <input type="text" id="fullName" name="fullName" required placeholder="Jane Doe">
      </div>

      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required placeholder="jane@example.com">
      </div>

      <div class="form-group">
        <label for="role">Primary Focus</label>
        <select id="role" name="role">
          <option value="frontend">Frontend Development</option>
          <option value="backend">Backend Development</option>
          <option value="fullstack">Full Stack</option>
        </select>
      </div>

      <button type="submit" class="submit-btn">Create Account</button>
    </form>
  </div>
</body>
</html>
`,
      css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.form-wrapper {
  background: #ffffff;
  padding: 2.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 1.5rem;
  color: #0f172a;
}

.form-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

input, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.submit-btn {
  width: 100%;
  padding: 0.85rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #1d4ed8;
}
`
    }
  },
  {
    day: 3,
    stage: '02-modern-css-layouts',
    stageFolder: '02-flexbox-grid',
    topic: 'Responsive Flexbox Card Components',
    slug: '03-flexbox-card-grid',
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 3 - Flexbox Cards</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="section-title">
      <h2>Featured Learning Tracks</h2>
      <p>Master modern web engineering step by step.</p>
    </header>

    <div class="card-grid">
      <div class="card">
        <span class="badge">HTML5</span>
        <h3>Semantic Markup</h3>
        <p>Build accessible, SEO-friendly document structures with modern HTML tags.</p>
        <a href="#learn" class="card-link">Explore &rarr;</a>
      </div>

      <div class="card">
        <span class="badge">CSS3</span>
        <h3>Flexbox & Grid</h3>
        <p>Design complex, fully responsive layouts without external frameworks.</p>
        <a href="#learn" class="card-link">Explore &rarr;</a>
      </div>

      <div class="card">
        <span class="badge">JavaScript</span>
        <h3>Core & Internals</h3>
        <p>Understand the event loop, closures, prototypes, and asynchronous patterns.</p>
        <a href="#learn" class="card-link">Explore &rarr;</a>
      </div>
    </div>
  </div>
</body>
</html>
`,
      css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
  padding: 40px 20px;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  margin-bottom: 40px;
}

.section-title h2 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.section-title p {
  color: #94a3b8;
}

.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 24px;
  flex: 1 1 280px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  border-color: #38bdf8;
}

.badge {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
  margin-bottom: 16px;
}

.card h3 {
  margin-bottom: 8px;
  font-size: 1.25rem;
}

.card p {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 20px;
  flex-grow: 1;
}

.card-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}
`
    }
  }
];

export function getHtmlCssRoadmapDay(dayIndex: number): HtmlCssRoadmapDay {
  const normalized = (dayIndex - 1) % HTML_CSS_ROADMAP.length;
  return HTML_CSS_ROADMAP[normalized];
}
