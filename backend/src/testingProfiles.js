// backend/src/testingProfiles.js
export const testingProfiles = {
      // --- Lavinia ---
      lavinia: {
        login: {
          path: "/login",
          usernameSelector: 'input[name="email"], input[type="email"]',
          passwordSelector: 'input[name="password"], input[type="password"]',
          submitSelector: 'button[type="submit"], button:has-text("Sign in"), [data-test="login-submit"]',
          usernameEnv: "LAVINIA_USERNAME",
          passwordEnv: "LAVINIA_PASSWORD"
        },
        prompts: {
          exploratory: `
    Primary goal: Systematically explore Lavinia across all sections and states.
    
    Dynamic Flow:
    1) Authentication
       - Login with LAVINIA_USERNAME and LAVINIA_PASSWORD.
       - Validate error handling for invalid/empty input.
       - Confirm dashboard loads with no console errors.
    
    2) Section Discovery
       - Enumerate all visible sections/tabs from the dashboard nav.
       - For each section:
         - Open list view -> confirm items render correctly.
         - Open multiple detail pages (first, last, random).
         - Validate text, media, and forms render.
         - Check search, filters, and pagination (if present).
    
    3) State Exploration
       - Empty list view (if present).
       - Invalid URL -> error page renders.
       - Logged-in vs logged-out restrictions.
    
    4) Cross-Cutting
       - Validate responsiveness (resize browser).
       - Check for broken links/404s.
       - Monitor console for errors/warnings.
       - Verify accessibility basics (labels, keyboard navigation).
    
    Avoid destructive operations (delete, deactivate, purchase).
    `,
    
          smoke: `
    Smoke test for Lavinia (dynamic):
    
    1) Login -> confirm dashboard loads without console errors.
    2) Auto-discover first section from nav -> verify list view renders.
    3) Open first item -> detail page renders correctly.
    4) If form is available, validate safe submit -> non-error response.
    Stop if any major blocker is found.
    `,
    
          regression: `
    Regression test for Lavinia (dynamic):
    
    1) Re-run stable flows:
       - Login -> dashboard.
       - Enumerate all nav sections -> open representative detail pages.
       - Run search/filter/pagination if available.
       - Submit safe forms (settings/profile).
    2) Confirm UI structure, labels, and layout are consistent.
    3) Validate URLs and status codes.
    4) Watch console for regressions.
    `,
    
          feature: `
    Feature validation for Lavinia:
    
    1) Detect the newest/experimental feature surface (highlighted nav item, "New" badge, or recently added flow).
    2) Verify visibility, required fields, and labels.
    3) Run a happy-path submit/interaction.
    4) Confirm correct confirmation/feedback and no console errors.
    `
        }
      },
    
      // --- passagePrep ---
      passagePrep: {
        login: {
          path: "/auth/signin",
          usernameSelector: '#email, input[name="email"]',
          passwordSelector: '#password, input[name="password"]',
          submitSelector: 'button:has-text("Sign in"), button[type="submit"]',
          usernameEnv: "PASSAGEPREP_USERNAME",
          passwordEnv: "PASSAGEPREP_PASSWORD"
        },
        prompts: {
          exploratory: `
    Primary goal: Systematically explore PassagePrep across all sections and states.
    
    Dynamic Flow:
    1) Authentication
       - Login with PASSAGEPREP_USERNAME and PASSAGEPREP_PASSWORD.
       - Validate error handling on invalid/empty input.
       - Confirm dashboard loads without console errors.
    
    2) Section Discovery
       - Enumerate all nav items (Passages, Questions, Practice Sets, or any new ones).
       - For each section:
         - Verify list view loads with correct pagination/scroll.
         - Open first, last, and random detail items.
         - Validate text, images, PDFs, and media load correctly.
         - Test search and filters dynamically.
    
    3) State Exploration
       - Check empty results (e.g., empty search).
       - Open invalid URLs -> correct error page.
       - Test behavior for media-heavy content.
       - Confirm logged-out state restricts access.
    
    4) Interactions
       - Locate filters, forms, toggles (like hints/solutions).
       - Validate required fields and error messages.
       - Confirm safe submit/interaction works (non-destructive).
    
    5) Cross-Cutting
       - Monitor broken links/404s.
       - Validate responsiveness and keyboard navigation.
       - Watch console for errors/warnings.
    
    Avoid destructive operations (delete, deactivate, purchase).
    `,
    
          smoke: `
    Smoke test for PassagePrep (dynamic):
    
    1) Login -> dashboard loads cleanly.
    2) Discover first section -> verify list view renders.
    3) Open first item -> confirm detail content loads correctly.
    4) Run a basic search -> confirm results.
    Stop on first major blocker.
    `,
    
          regression: `
    Regression test for PassagePrep (dynamic):
    
    1) Login -> dashboard.
    2) Enumerate all nav sections -> open representative detail pages.
    3) Validate search, filters, and pagination.
    4) Check hints/solutions toggle still works.
    5) Confirm UI layout, labels, and navigation remain stable.
    6) Watch console for regressions.
    `,
    
          feature: `
    Feature validation for PassagePrep:
    
    1) Identify newest feature (e.g., hints/solutions toggle, new comprehension UX).
    2) Verify visibility and accessibility.
    3) Run happy-path toggle/submit flow.
    4) Confirm expected confirmation/feedback appears without console errors.
    `
        }
      },
    
      // --- teachingChannel ---
      teachingChannel: {
        login: {
          path: "/login",
          usernameSelector: 'input[name="username"], input[name="email"]',
          passwordSelector: 'input[type="password"], input[name="password"]',
          submitSelector: 'button:has-text("Log in"), button[type="submit"]',
          usernameEnv: "TEACHING_USERNAME",
          passwordEnv: "TEACHING_PASSWORD"
        },
        prompts: {
          exploratory: `
    Primary goal: Explore TeachingChannel thoroughly across all channels, posts, and notifications.
    
    Dynamic Flow:
    1) Authentication
       - Login with TEACHING_USERNAME and TEACHING_PASSWORD.
       - Validate error handling for invalid/empty input.
       - Confirm channel list loads with no console errors.
    
    2) Channel Discovery
       - Enumerate all available channels from channel list.
       - For each channel:
         - Verify posts list loads.
         - Open representative posts -> validate text, media, and attachments.
         - Test infinite scroll/pagination.
         - Open composer (do NOT send).
    
    3) State Exploration
       - Empty channel (no posts).
       - Large channel performance check.
       - Invalid channel ID -> correct error page.
       - Open notifications panel -> verify rendering.
    
    4) Interactions
       - Open composer form (no send).
       - Interact with reactions/emoji bar.
       - Open thread reply form (do not post).
       - Validate input fields and error handling.
    
    5) Cross-Cutting
       - Monitor navigation between channels.
       - Check responsiveness (mobile/desktop).
       - Watch console for warnings/errors.
       - Validate accessibility basics.
    
    Avoid destructive/public actions (don’t send posts or delete).
    `,
    
          smoke: `
    Smoke test for TeachingChannel (dynamic):
    
    1) Login -> confirm channel list loads cleanly.
    2) Open first channel -> verify posts render.
    3) Open composer form -> confirm UI loads (no send).
    4) Open notifications panel -> confirm loads without errors.
    Stop at first major blocker.
    `,
    
          regression: `
    Regression test for TeachingChannel (dynamic):
    
    1) Login -> load channel list.
    2) Open representative channel -> confirm posts render correctly.
    3) Validate composer loads correctly (UI stable).
    4) Validate notifications panel behavior.
    5) Confirm labels, layout, and navigation consistent.
    6) Watch console for regressions.
    `,
    
          feature: `
    Feature validation for TeachingChannel:
    
    1) Locate newest feature (e.g., reactions/emoji bar, thread reply UX).
    2) Verify it renders correctly.
    3) Interact with it (without posting).
    4) Confirm expected UI/feedback and no console errors.
    `
        }
      },
    
      // --- Fallback defaults ---
      _default: {
        login: null,
        prompts: {
          exploratory: `General exploratory: dynamically enumerate nav sections, test login (if any), forms, broken links, console errors.`,
          smoke: `Smoke: login -> open first nav section -> open detail -> validate UI loads cleanly.`,
          regression: `Regression: re-run known green paths dynamically; verify elements, layout, and statuses.`,
          feature: `Feature: locate newest/flagged UI surface dynamically; verify visibility and interactions.`
        }
      }
    }
    