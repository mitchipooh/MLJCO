const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const port = process.env.PORT || 5500;

const rootDir = path.resolve(__dirname, "..");
const dataFile = path.join(__dirname, "data", "pages.json");
const uploadsDir = path.join(__dirname, "uploads");

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));
app.use("/assets", express.static(path.join(rootDir, "assets")));
app.use("/admin", express.static(path.join(rootDir, "admin")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed."));
      return;
    }
    cb(null, true);
  }
});

function readPages() {
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writePages(pages) {
  fs.writeFileSync(dataFile, JSON.stringify(pages, null, 2));
}

function resolvePageKey(fileName) {
  const clean = fileName.replace(".html", "").trim();
  return clean === "index" || clean.length === 0 ? "index" : clean;
}

function sectionLabels(pageKey) {
  const labels = {
    index: ["Hero", "Why Choose Us", "Industries & Call To Action"],
    about: ["About Intro", "Who We Are and How We Work", "Taglines"],
    services: ["Services Intro", "Service List"],
    projects: ["Projects Intro", "Gallery and Call To Action"],
    "safety-quality": ["Safety Intro", "HSE and Quality Details"],
    "request-quote": ["Quote Intro", "Quote Form and Support"],
    contact: ["Contact Intro", "Contact Details and Message Form"]
  };
  return labels[pageKey] || [];
}

function splitIntoSections(html) {
  if (typeof html !== "string" || !html.trim()) {
    return [];
  }
  const matches = html.match(/<section[\s\S]*?<\/section>/gi);
  if (matches && matches.length) {
    return matches.map((chunk) => chunk.trim()).filter(Boolean);
  }
  return [html.trim()];
}

function normalizeSectionsForPage(pageKey, page) {
  if (!page || typeof page !== "object") {
    return {
      title: "Page",
      sections: []
    };
  }

  if (Array.isArray(page.sections)) {
    const normalizedSections = page.sections
      .filter((section) => section && typeof section === "object")
      .map((section, index) => ({
        id: section.id || `${pageKey}-section-${index + 1}`,
        label:
          typeof section.label === "string" && section.label.trim()
            ? section.label.trim()
            : sectionLabels(pageKey)[index] || `Section ${index + 1}`,
        html: typeof section.html === "string" ? section.html : ""
      }));

    return {
      title: page.title || "Page",
      sections: normalizedSections
    };
  }

  const chunks = splitIntoSections(page.html || "");
  return {
    title: page.title || "Page",
    sections: chunks.map((chunk, index) => ({
      id: `${pageKey}-section-${index + 1}`,
      label: sectionLabels(pageKey)[index] || `Section ${index + 1}`,
      html: chunk
    }))
  };
}

function normalizePagesData(pages) {
  const normalized = {};
  Object.entries(pages).forEach(([key, page]) => {
    normalized[key] = normalizeSectionsForPage(key, page);
  });
  return normalized;
}

function getBodyHtmlFromSections(page) {
  if (!page || !Array.isArray(page.sections)) {
    return "";
  }
  return page.sections.map((section) => section.html || "").join("\n");
}

function getBaseShell({ title, activePage, bodyHtml }) {
  const pages = [
    ["index", "Home", "index.html"],
    ["about", "About Us", "about.html"],
    ["services", "Services", "services.html"],
    ["projects", "Projects / Gallery", "projects.html"],
    ["safety-quality", "Safety & Quality", "safety-quality.html"],
    ["request-quote", "Request a Quote", "request-quote.html"],
    ["contact", "Contact Us", "contact.html"]
  ];

  const nav = pages
    .map(([key, label, href]) => `<a${key === activePage ? ' class="active"' : ""} href="${href}">${label}</a>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | M.J.CO Limited</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@400;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="assets/css/styles.css" />
  </head>
  <body>
    <header class="site-header">
      <div class="container nav-wrap">
        <a class="brand" href="index.html">M.J.CO LIMITED <small>General Construction & Maintenance</small></a>
        <button class="nav-toggle" aria-label="Open menu">Menu</button>
        <nav class="site-nav">${nav}</nav>
      </div>
    </header>

    <main id="page-content">${bodyHtml}</main>

    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <strong>M.J.CO Limited</strong><br />
          General Construction & Maintenance<br />
          Lot #6 Hill Top Palms, Hill Top Drive, Ravine Sable, Longdenville, Chaguanas, Trinidad & Tobago
        </div>
        <div>
          Phone: 789-4949 / 763-8489<br />
          Email: mjcolimited765@gmail.com<br />
          VAT No.: 385045<br />
          <small>Copyright <span data-year></span> M.J.CO Limited</small>
        </div>
      </div>
    </footer>

    <script src="assets/js/site.js"></script>
  </body>
</html>`;
}

function renderAllPages() {
  const pages = normalizePagesData(readPages());
  Object.entries(pages).forEach(([key, page]) => {
    const fileName = key === "index" ? "index.html" : `${key}.html`;
    const targetPath = path.join(rootDir, fileName);
    const html = getBaseShell({
      title: page.title || "Page",
      activePage: key,
      bodyHtml: getBodyHtmlFromSections(page)
    });
    fs.writeFileSync(targetPath, html);
  });
}

app.get("/api/pages", (req, res) => {
  const pages = normalizePagesData(readPages());
  const summaries = {};
  Object.entries(pages).forEach(([key, page]) => {
    summaries[key] = {
      title: page.title,
      sectionCount: page.sections.length
    };
  });
  res.json(summaries);
});

app.get("/api/pages/:pageKey", (req, res) => {
  const pages = normalizePagesData(readPages());
  const page = pages[req.params.pageKey];
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json(page);
});

app.put("/api/pages/:pageKey", (req, res) => {
  const { title, sections } = req.body;
  if (!Array.isArray(sections)) {
    res.status(400).json({ error: "sections array is required" });
    return;
  }

  const pages = normalizePagesData(readPages());
  if (!pages[req.params.pageKey]) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const cleanedSections = sections.map((section, index) => ({
    id:
      typeof section.id === "string" && section.id.trim()
        ? section.id.trim()
        : `${req.params.pageKey}-section-${index + 1}`,
    label:
      typeof section.label === "string" && section.label.trim()
        ? section.label.trim()
        : `Section ${index + 1}`,
    html: typeof section.html === "string" ? section.html : ""
  }));

  pages[req.params.pageKey] = {
    title: typeof title === "string" && title.trim() ? title.trim() : pages[req.params.pageKey].title,
    sections: cleanedSections
  };

  writePages(pages);
  renderAllPages();
  res.json({ ok: true, page: pages[req.params.pageKey] });
});

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image uploaded" });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ ok: true, url, name: req.file.originalname });
});

app.get("/api/uploads", (req, res) => {
  const files = fs
    .readdirSync(uploadsDir)
    .filter((name) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name))
    .map((name) => ({ name, url: `/uploads/${name}` }));
  res.json(files);
});

app.delete("/api/uploads/:fileName", (req, res) => {
  const fileName = path.basename(req.params.fileName);
  const target = path.join(uploadsDir, fileName);
  if (!fs.existsSync(target)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  fs.unlinkSync(target);
  res.json({ ok: true });
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(rootDir, "admin", "index.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.get(/^\/[a-z0-9-]+\.html$/i, (req, res) => {
  const pageKey = resolvePageKey(req.path);
  const pages = readPages();
  if (!pages[pageKey]) {
    res.status(404).send("Page not found");
    return;
  }
  res.sendFile(path.join(rootDir, `${pageKey}.html`));
});

app.use((err, req, res, next) => {
  if (err) {
    res.status(400).json({ error: err.message || "Request failed" });
    return;
  }
  next();
});

const normalizedAtBoot = normalizePagesData(readPages());
writePages(normalizedAtBoot);
renderAllPages();

app.listen(port, () => {
  console.log(`CMS server running on http://localhost:${port}`);
});
