// backend/src/testingProfiles.js
export const testingProfiles = {
      // --- Lavinia ---
      lavinia: {
        login: {
          path: "/login",
      usernameSelector: 'input[name="email"], input[type="email"], #user_email, #user_login',
      passwordSelector: 'input[name="password"], input[type="password"], #user_pass',
      submitSelector: 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
      usernameEnv: "faraz.khan+1@k12coalition.com",
      passwordEnv: "zJmIMIgp&i%fhP1HjhoRY^D6"
    },
    basicAuth: {
      username: "laviniagro1stg",
      password: "7ada27f4"
        },
        prompts: {
      smoke: `
SMOKE TEST - Execute Both Scenarios in Order:

MANDATORY EXECUTION ORDER:

SCENARIO 1 - POSITIVE LOGIN (Execute First):
1) Navigate to the provided URL
2) Click on "PLATFORM LOGIN" button/link
3) Fill username field with valid credentials
4) Fill password field with valid credentials
5) Click "Login" or "Sign In" button
6) Verify successful login and dashboard access
7) Check for any JavaScript console errors
8) Find and click "Sign Out" or "Logout" option
9) Verify return to homepage

SCENARIO 2 - NEGATIVE LOGIN (Execute Second):
1) Navigate to the provided URL again
2) Click on "PLATFORM LOGIN" button/link
3) Leave username field completely empty
4) Leave password field completely empty
5) Click "Login" or "Sign In" button
6) Verify error message appears
7) Verify user stays on login page

CRITICAL REQUIREMENTS:
- MUST execute Scenario 1 (positive) FIRST
- MUST execute Scenario 2 (negative) SECOND
- Complete both scenarios before ending
- Positive scenario should succeed
- Negative scenario should show validation errors

DO NOT END TEST until both scenarios are completed.
`,

      exploratory: `
EXPLORATORY TEST - Deep Application Feature Discovery:

COMPREHENSIVE APPLICATION EXPLORATION (30+ Actions Required):

1) Authentication & User Management Deep Dive
   - Test login with valid credentials -> verify dashboard access
   - Test logout functionality -> verify returns to homepage
   - Attempt login with invalid credentials -> verify error handling
   - Check "Remember Me" functionality if present
   - Test password reset/forgot password flow
   - Explore user profile settings and preferences
   - Test account creation and registration process

2) Complete Navigation & Content Discovery
   - Systematically click EVERY menu item and submenu
   - Test ALL footer links and secondary navigation
   - Explore breadcrumb navigation on deep pages
   - Test site search functionality throughout application
   - Navigate using browser back/forward buttons
   - Test internal page-to-page linking
   - Explore any hidden or advanced navigation options

3) Core Application Features Deep Testing
   - Test all main application sections and modules
   - Explore data tables, lists, and grid functionality
   - Test advanced filtering, sorting, and pagination
   - Check form functionality and validation rules
   - Test file upload/download capabilities
   - Explore reporting and analytics features
   - Test any workflow or process automation

4) User Management & Account Features
   - Explore user profile management thoroughly
   - Test role-based access controls and permissions
   - Check user settings and customization options
   - Test password change and security features
   - Explore user account creation and management
   - Test user permissions for different features
   - Check user activity logs and audit trails

5) Content Management & Data Operations
   - Test content creation and editing workflows
   - Explore resource upload and management systems
   - Test content publishing and approval processes
   - Check content search, filtering, and organization
   - Test content versioning and rollback features
   - Explore content sharing and collaboration tools
   - Test data import/export functionality

6) Advanced Application Features
   - Test any assessment or evaluation tools
   - Explore progress tracking and analytics
   - Check reporting and data visualization features
   - Test communication tools (messaging, notifications)
   - Explore calendar and scheduling features
   - Test collaboration and group features
   - Check any gamification or engagement features

7) Data Management & Analytics Deep Dive
   - Test data export and reporting features
   - Explore backup and restore functionality
   - Check data import capabilities and validation
   - Test data security and privacy features
   - Explore analytics and performance metrics
   - Check data integrity and consistency
   - Test any data migration or synchronization tools

8) Integration & Third-Party Features
   - Test any third-party integrations thoroughly
   - Explore API endpoints and data exchange
   - Check external resource linking and embedding
   - Test any payment or billing integrations
   - Explore email notification and communication systems
   - Check any social or collaboration features
   - Test any external tool integrations

9) Performance & Technical Deep Dive
   - Monitor page load times across all sections
   - Check for JavaScript errors on every page
   - Test with different network conditions
   - Explore concurrent user access scenarios
   - Test memory usage during extended sessions
   - Check database performance and connectivity
   - Test API response times and reliability

10) Edge Cases & Advanced Scenarios
   - Test with large datasets and performance limits
   - Explore concurrent user access scenarios
   - Test data validation and error handling
   - Check accessibility features and compliance
   - Test mobile responsiveness across all features
   - Explore offline functionality if available
   - Test unusual user workflows and edge cases

MANDATORY EXPLORATION REQUIREMENTS:
- Test MINIMUM 30 application-specific actions
- Explore ALL major application sections thoroughly
- Test ALL interactive features and tools discovered
- Document any new features or functionality found
- Check console errors and performance on every page
- Test edge cases and unusual scenarios

Continue exploring until comprehensive application understanding achieved or 40+ actions completed.
    `,
    
          regression: `
REGRESSION TEST - Comprehensive Application Stability Check:

DEEP APPLICATION TESTING SEQUENCE (25+ Actions Required):

1) Authentication & Session Management
   - Login with valid credentials -> verify dashboard access
   - Test session persistence across multiple page navigations
   - Verify logout functionality -> return to homepage
   - Test login with invalid credentials -> verify error handling
   - Check "Remember Me" functionality if present
   - Test password reset/forgot password flow

2) Complete Navigation Testing
   - Test ALL main navigation menu items
   - Verify breadcrumb navigation works correctly
   - Test footer links and secondary navigation
   - Check mobile navigation and responsive menu
   - Test search functionality throughout the application
   - Verify internal page-to-page linking

3) Core Application Features
   - Test all main application sections and modules
   - Verify data tables and lists display correctly
   - Test filtering, sorting, and pagination features
   - Check form functionality and validation
   - Test any file upload/download capabilities
   - Verify any reporting or analytics features

4) User Management & Account Features
   - Test user profile management and settings
   - Verify account creation and registration process
   - Test role-based access controls and permissions
   - Check user preferences and customization options
   - Test password change and security features
   - Verify user activity logs and history

5) Content Management & Data Operations
   - Test content creation and editing workflows
   - Verify data import/export functionality
   - Check content publishing and approval processes
   - Test search and filtering capabilities
   - Verify data validation and error handling
   - Test backup and restore features

6) Application Performance & Technical
   - Monitor page load times across all sections
   - Check for JavaScript errors on all pages
   - Verify database connectivity and performance
   - Test concurrent user access scenarios
   - Check memory usage during extended sessions
   - Verify API endpoints and data exchange

7) Integration & Third-Party Features
   - Test any third-party integrations
   - Verify external API connections
   - Check payment/billing integrations if present
   - Test email notification systems
   - Verify social media integrations
   - Check any external resource linking

8) Security & Data Protection
   - Test data security and privacy features
   - Verify SSL certificate and HTTPS enforcement
   - Check input validation and sanitization
   - Test access control and authorization
   - Verify data encryption and protection
   - Check audit logs and security monitoring

9) Responsive Design & Accessibility
   - Test responsive design across different screen sizes
   - Verify mobile functionality and touch interactions
   - Check accessibility features and compliance
   - Test keyboard navigation and screen readers
   - Verify print functionality for key pages
   - Check browser compatibility

10) Error Handling & Edge Cases
   - Test error pages and error handling
   - Verify form validation and error messages
   - Check timeout and session expiration handling
   - Test with slow network connections
   - Verify graceful degradation of features
   - Check error logging and monitoring

CRITICAL REGRESSION REQUIREMENTS:
- Test MINIMUM 25 application-specific actions
- Visit ALL major application sections
- Test ALL interactive features and tools
- Verify NO functionality degradation
- Check performance across all application areas
- Ensure data integrity and security

STABILITY CHECKPOINTS:
- All application features must work as before
- User sessions must remain stable
- Data must be consistent across sessions
- Performance must meet established standards
- All integrations must function correctly

Continue testing until comprehensive application coverage achieved or 35+ actions completed.
    `,
    
          feature: `
FEATURE TEST for Lavinia Agricultural Platform - New Feature Validation:

TARGETED FEATURE DISCOVERY & TESTING (20+ Actions Required):

1) New Feature Identification
   - Scan homepage for "New", "Updated", or "Recently Added" badges
   - Look for new menu items or navigation changes
   - Check for new call-to-action buttons or promotional content
   - Identify any new forms, widgets, or interactive elements
   - Look for new product offerings or service pages

2) Enhanced Content & Media Features
   - Test any new image galleries or photo albums
   - Verify new video content plays correctly
   - Check new downloadable resources (PDFs, brochures)
   - Test new blog posts or news articles
   - Verify new testimonials or case studies

3) New Business Features
   - Test new product catalog entries
   - Verify new service offerings pages
   - Check new pricing or quote request forms
   - Test any new customer portal features
   - Verify new contact or support channels

4) Improved User Experience Features
   - Test new search functionality or filters
   - Verify enhanced navigation or menu systems
   - Check new responsive design improvements
   - Test new mobile-specific features
   - Verify new accessibility improvements

5) New Form & Interactive Elements
   - Test any new contact or inquiry forms
   - Verify new newsletter signup options
   - Check new user registration processes
   - Test new feedback or survey forms
   - Verify new social media integration

6) Technical & Performance Enhancements
   - Test new page loading optimizations
   - Verify new security features (SSL, form validation)
   - Check new analytics or tracking implementation
   - Test new third-party integrations
   - Verify new SEO improvements

7) New Integration Features
   - Test new social media widgets or feeds
   - Verify new Google Maps or location features
   - Check new payment processing options
   - Test new email marketing integrations
   - Verify new CRM or lead capture systems

8) Feature Integration Testing
   - Verify new features work with existing navigation
   - Test new features across different browsers
   - Check new features on mobile devices
   - Verify new features don't break existing functionality
   - Test new features with different user scenarios

VALIDATION REQUIREMENTS:
- Test MINIMUM 20 feature-specific actions
- Verify new features work as intended
- Check integration with existing functionality
- Test across multiple devices/browsers
- Verify no existing features are broken
- Document any issues or improvements needed

SUCCESS CRITERIA:
- All new features function correctly
- No regression in existing functionality
- New features enhance user experience
- Performance impact is minimal
- Mobile compatibility maintained
- All integrations work seamlessly

Continue testing until all identified new features are thoroughly validated.
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
        basicAuth: {
          username: "admin",
          password: "passageprep2024"
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
        basicAuth: {
          username: "teacher",
          password: "teaching2024"
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
    