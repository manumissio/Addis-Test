# Codebase Improvement Recommendations

A prioritized analysis of the **AddisIdeas** codebase with actionable improvements organized by severity.

---

## 1. CRITICAL: Security Vulnerabilities

### 1.1 Hardcoded Database Credentials
- **Files:** `app.php:27-48`, `upload.php:4-14`
- **Issue:** Database host, username, and password are hardcoded in plain text and committed to version control.
- **Fix:** Move credentials to environment variables or a `.env` file excluded from git via `.gitignore`. Use `getenv()` or a library like `vlucas/phpdotenv`.

### 1.2 SQL Injection
- **Files:** `app.php` (throughout), `upload.php:150-183`
- **Issue:** SQL queries are built using string concatenation with user-supplied values (e.g., `registerUser()` at line 244, `upload.php` at lines 150, 183). Example:
  ```php
  $qy = 'SELECT "SP_newuser"('.$s_q.$username.$s_q.', ...);';
  ```
- **Fix:** Use parameterized queries with `pg_query_params()` instead of string concatenation.

### 1.3 Weak Password Hashing
- **File:** `app.php:241`
- **Issue:** `crypt($password)` is used without specifying an algorithm or cost factor. This defaults to a weak DES-based hash.
- **Fix:** Replace with `password_hash($password, PASSWORD_BCRYPT)` and verify with `password_verify()`.

### 1.4 Password Fields Displayed as Plain Text
- **File:** `signup.html:80, 85`
- **Issue:** Password input fields use `type="text"` instead of `type="password"`, exposing passwords on screen.
- **Fix:** Change both password inputs to `type="password"`.

### 1.5 Insecure Cookie Configuration
- **File:** `app.php:104, 265`
- **Issue:** Session cookies are set without `Secure`, `HttpOnly`, or `SameSite` flags. The cookie expiry is also hardcoded to 3 hours with no renewal mechanism.
- **Fix:** Set cookies with `setcookie('user', $value, ['secure' => true, 'httponly' => true, 'samesite' => 'Strict'])`.

### 1.6 No CSRF Protection
- **Issue:** All forms submit via AJAX POST without any CSRF token validation. An attacker could craft a malicious page that submits requests on behalf of an authenticated user.
- **Fix:** Generate a CSRF token per session, include it in forms, and validate it server-side on every state-changing request.

### 1.7 HTTP Used Instead of HTTPS
- **Files:** `login.html:20`, `signup.html:14`, `login.html:90`, `signup.html:128`
- **Issue:** jQuery CDN and Google Analytics are loaded over plain HTTP, enabling man-in-the-middle attacks.
- **Fix:** Change all `http://` resource URLs to `https://`.

### 1.8 File Upload MIME Type Spoofing
- **File:** `upload.php:42`
- **Issue:** Upload validation relies solely on the `$_FILES['picture']['type']` value, which is set by the client and easily spoofed.
- **Fix:** Validate using server-side checks: `finfo_file()` for MIME type, and verify the file extension. Consider using `getimagesize()` to confirm the file is a real image.

### 1.9 No Input Sanitization / XSS Protection
- **Issue:** User input is echoed directly in PHP responses and rendered in AngularJS templates without consistent escaping. While AngularJS auto-escapes `{{ }}` bindings, raw HTML insertion via `$sce.trustAsHtml()` or jQuery `.html()` calls bypass this.
- **Fix:** Sanitize all output with `htmlspecialchars()` on the PHP side. Avoid using `.html()` with unsanitized data in JavaScript.

---

## 2. HIGH: Architecture & Structure

### 2.1 Monolithic PHP Backend
- **File:** `app.php` (1,181 lines)
- **Issue:** The entire backend is a single file with a flat `switch` statement for routing. This makes the code hard to maintain, test, and extend.
- **Fix:** Adopt a lightweight PHP framework (e.g., Slim, Laravel) or at minimum split into separate files per concern (auth, ideas, users, messages). Implement a proper routing system.

### 2.2 Monolithic JavaScript Frontend
- **File:** `js/app.js` (1,786 lines)
- **Issue:** All AngularJS controllers, services, and configuration live in one file.
- **Fix:** Split into separate files per controller/service. Use a module bundler (Webpack, Vite) to manage dependencies.

### 2.3 Mixed jQuery and AngularJS
- **Files:** `js/app.js`, `appl.js`
- **Issue:** jQuery DOM manipulation (`$('#element').val()`, `.keyup()`, `.html()`) is used extensively inside AngularJS controllers. This is an anti-pattern that breaks AngularJS's digest cycle and makes the code unpredictable.
- **Fix:** Replace jQuery DOM operations with AngularJS directives (`ng-model`, `ng-change`, `ng-click`). Use AngularJS `$http` instead of `$.ajax`.

### 2.4 Duplicated Database Connection Code
- **Files:** `app.php:39-48`, `upload.php:4-14`
- **Issue:** The `dbConn()` function is copy-pasted across files with identical credentials.
- **Fix:** Extract to a single shared include file (e.g., `config/database.php`).

### 2.5 No Separation of Concerns
- **Issue:** The PHP backend mixes database queries, business logic, request handling, and response formatting in single functions.
- **Fix:** Implement a layered architecture: routing -> controllers -> services -> data access.

### 2.6 Legacy/Dead Code in Repository
- **Files:** `app_old.php`, `appl_old.js`, `profile.zip`, `signup.zip`, `partials/idea_screen_old.html`, `partials/idea_screen1.html`
- **Issue:** Old versions of files and ZIP archives are tracked in git, adding confusion and repo bloat.
- **Fix:** Remove all `*_old.*` files and ZIP archives. Git history already preserves old versions.

### 2.7 Duplicated Asset Directories
- **Directories:** `img/ico/` and `images/ico/`
- **Issue:** Two directories contain identical favicon/icon files. Different HTML pages reference different paths.
- **Fix:** Consolidate into a single `images/ico/` directory and update all references.

---

## 3. MEDIUM: Code Quality

### 3.1 No Environment Configuration
- **Issue:** URLs are hardcoded throughout (e.g., `http://addisideas.info/`, `http://localhost/test/`). Database credentials are hardcoded. There is no distinction between development and production environments.
- **Fix:** Create an environment configuration system. Use `.env` files for environment-specific values. Define a `config.php` and `config.js` that read from environment.

### 3.2 No Error Handling Strategy
- **Issue:** Database errors are silently ignored or produce generic "false" responses. PHP errors are not caught. JavaScript AJAX errors have minimal handling.
- **Fix:** Implement structured error handling: try/catch blocks, proper HTTP status codes, error logging, and user-friendly error messages.

### 3.3 No Logging
- **Issue:** There is no logging mechanism for debugging, auditing, or monitoring. Failed logins, errors, and security events go unrecorded.
- **Fix:** Add a logging library (e.g., Monolog for PHP). Log authentication events, errors, and important state changes.

### 3.4 No Automated Tests
- **Issue:** There are zero test files in the repository. No unit tests, integration tests, or end-to-end tests.
- **Fix:** Add PHPUnit for backend testing and Jasmine/Karma for AngularJS testing. Start with tests for authentication and idea creation flows.

### 3.5 Inconsistent Code Style
- **Issue:** Mixed tabs and spaces, inconsistent brace placement, variable naming conventions vary (`$s_q`, `$pw_hash`, `$upload_db_path`). HTML indentation is erratic (e.g., `signup.html` has 11+ tabs of indentation).
- **Fix:** Adopt a coding standard (PSR-12 for PHP, a standard ESLint config for JS). Add a `.editorconfig` file. Run a formatter.

### 3.6 Commented-Out Code
- **Issue:** Many files contain large blocks of commented-out code (e.g., `app.php`, `appl.js`, `index.html`). This adds noise and makes the codebase harder to read.
- **Fix:** Remove all commented-out code. Rely on git history for recovery if needed.

### 3.7 Global JavaScript Variables
- **Files:** `appl.js:1-18`, `js/app.js:2`
- **Issue:** Variables like `checktype`, `active_page`, `originalIdea`, and `us` are declared in global scope, risking name collisions and making the code harder to reason about.
- **Fix:** Encapsulate in AngularJS services or use IIFEs to avoid polluting the global namespace.

---

## 4. MEDIUM: Frontend

### 4.1 Outdated Framework Versions
- **Issue:**
  - AngularJS 1.5.0-rc.2 (release candidate; AngularJS reached end-of-life in December 2021)
  - Bootstrap 3.3.6 (Bootstrap 3 is end-of-life)
  - jQuery 2.2.1 / 2.1.4 (outdated, jQuery 2.x dropped IE 6-8 support but is otherwise old)
  - Font Awesome 3.2.1 (current version is 6.x)
- **Fix:** Plan a migration path. Short-term: upgrade to stable releases of current major versions. Long-term: migrate from AngularJS to a supported framework (Angular, React, or Vue).

### 4.2 jQuery Loaded Twice
- **File:** `login.html:16-21`
- **Issue:** jQuery is loaded twice: once from cdnjs (2.2.1) and once from code.jquery.com (2.1.4), followed by two copies of Bootstrap JS.
- **Fix:** Remove the duplicate. Keep a single version loaded from one CDN.

### 4.3 No Build System
- **Issue:** There is no build tool, bundler, or task runner. CSS and JS files are loaded individually without minification, concatenation, or cache-busting.
- **Fix:** Set up a build pipeline (Webpack, Vite, or Gulp) to bundle, minify, and version assets.

### 4.4 Hardcoded Base Path
- **File:** `index.html:10`
- **Issue:** `<base href="/test/">` assumes the app is always deployed at `/test/`. This breaks on any other deployment path.
- **Fix:** Make the base path configurable or derive it dynamically.

### 4.5 No Favicon MIME Type
- **Files:** `index.html:8`, `login.html:10`, `signup.html:12`
- **Issue:** `<link rel="icon" type="img/ico">` uses an invalid MIME type. The correct type is `image/x-icon`.
- **Fix:** Change to `type="image/x-icon"` or use a PNG favicon with `type="image/png"`.

---

## 5. LOW: Operations & DevOps

### 5.1 No `.gitignore`
- **Issue:** There is no `.gitignore` file. Sensitive files, IDE configs, and build artifacts could easily be committed.
- **Fix:** Add a `.gitignore` that excludes: `.env`, `*.zip`, `tmp/`, IDE files (`.idea/`, `.project`), `node_modules/`, and OS files (`.DS_Store`).

### 5.2 No Package Management
- **Issue:** All dependencies are loaded via CDN links or committed directly to the repo (e.g., `js/angular/angular-route.min.js`). There is no `package.json` or `composer.json`.
- **Fix:** Add `composer.json` for PHP dependencies and `package.json` for frontend dependencies. Use a package manager to track versions.

### 5.3 No README or Developer Documentation
- **File:** `README.md` exists but was not assessed for completeness.
- **Fix:** Ensure README covers: project setup, prerequisites, environment configuration, database setup, and deployment instructions.

### 5.4 Uploaded Files in Repository
- **Directories:** `user_images/`, `idea_images/`
- **Issue:** User-uploaded files are stored in the repo directory and could be committed.
- **Fix:** Add these directories to `.gitignore` (keep a `.gitkeep` file). In production, consider storing uploads in cloud object storage (S3, GCS).

### 5.5 No CI/CD Pipeline
- **Issue:** No automated build, test, or deployment pipeline.
- **Fix:** Add a GitHub Actions workflow for linting, testing, and deployment.

---

## Summary by Priority

| Priority | Count | Categories |
|----------|-------|-----------|
| Critical | 9 | Security vulnerabilities that could lead to data breach or account compromise |
| High | 7 | Architectural issues that severely hinder maintainability and scalability |
| Medium | 12 | Code quality and frontend issues that slow development and introduce bugs |
| Low | 5 | Operational improvements for long-term project health |

### Recommended Order of Action
1. Fix hardcoded credentials and add `.gitignore` (immediate)
2. Fix SQL injection vulnerabilities (immediate)
3. Fix password hashing and cookie security (immediate)
4. Fix password field types and HTTPS issues (immediate)
5. Add CSRF protection (short-term)
6. Split monolithic files and remove dead code (short-term)
7. Add environment configuration (short-term)
8. Add error handling and logging (medium-term)
9. Set up build system and package management (medium-term)
10. Add automated tests (medium-term)
11. Plan framework migration (long-term)
