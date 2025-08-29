// backend/src/testingProfiles.js
export const testingProfiles = {
   // --- Lavinia ---
   lavinia: {
     login: {
       path: "/login",
       usernameSelector: 'input[name="email"], input[type="email"], #user_email, #user_login',
       passwordSelector: 'input[name="password"], input[type="password"], #user_pass',
       // removed :has-text(...) (Playwright-only) -> keep pure CSS
       submitSelector: 'button[type="submit"], input[type="submit"]',
       usernameEnv: "faraz.khan+1@k12coalition.com",
       passwordEnv: "zJmIMIgp&i%fhP1HjhoRY^D6"
     },
     basicAuth: {
       username: "laviniagro1stg",
       password: "7ada27f4"
     },
     prompts: {
       smoke: `
 This is my URL : https://passageprepstg.wpenginepowered.com/ I want to do smoke test on it Basic auth username : passageprepstg and password is : 777456c1 Will you be able to do it ?
 
 Please execute a comprehensive smoke test including:
 
 1) Navigate to the URL with basic auth
 2) Test the login functionality 
 3) Verify page elements load correctly
 4) Check for any errors or issues
 5) Take screenshots at key moments
 6) Report findings and any problems discovered
 
 Execute this test thoroughly and provide detailed results.
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
    - Explore integration with external systems
    - Test mobile responsiveness and accessibility
    - Check performance under various conditions
 
 7) Security & Compliance Testing
    - Test input validation and sanitization
    - Check for common security vulnerabilities
    - Test session management and timeout
    - Verify data encryption and privacy
    - Test access controls and permissions
    - Check compliance with industry standards
    - Test backup and recovery procedures
 
 8) Error Handling & Edge Cases
    - Test application behavior with invalid inputs
    - Check error message clarity and helpfulness
    - Test boundary conditions and limits
    - Verify graceful degradation under stress
    - Test recovery from various failure modes
    - Check logging and monitoring capabilities
    - Test user guidance and help systems
 
 CRITICAL REQUIREMENTS:
 - Complete ALL 8 sections thoroughly
 - Generate 30+ meaningful test actions
 - Document all findings and issues
 - Provide actionable recommendations
 - Test both positive and negative scenarios
 - Focus on real user workflows and pain points
 `
     }
   },
 
   // --- Passage Prep Staging ---
   passagePrep: {
     basicAuth: {
       username: "passageprepstg",
       password: "777456c1"
     },
     login: {
       path: "/my-account/",
       username: "k12qaautomation@gmail.com",
       password: "yE4hkSy3iEvPlvUte!HB@#CQ",
 
       // broadened, robust CSS-only selectors
       usernameSelector:
         'input[name="username"], input[name="email"], input[type="email"], #username, #user_login, input[name="log"]',
       passwordSelector:
         'input[name="password"], input[type="password"], #password, #user_pass, input[name="pwd"]',
 
       // pure CSS; first matching/visible should be clicked by your runner
       submitSelector:
         'button[name="login"], button[type="submit"], input[type="submit"], #wp-submit',
 
       // explicit post-login success check (for your agent/runner)
       successText: "Dashboard",
       successTimeoutMs: 20000
     },
     prompts: {
       smoke: `
 This is my URL : https://passageprepstg.wpenginepowered.com/ I want to do smoke test on it Basic auth username : passageprepstg and password is : 777456c1 and whe we land on the page there will be username and password field put these username: "k12qaautomation@gmail.com",
     password: "yE4hkSy3iEvPlvUte!HB@#CQ" and then click Log In and wait until page contains Dashboard
 
 Please execute a comprehensive smoke test including:
 
 1) Navigate to the URL with basic auth
 2) Test the login functionality 
 3) Verify page elements load correctly
 4) Check for any errors or issues
 5) Take screenshots at key moments
 6) Report findings and any problems discovered
 
 Execute this test thoroughly and provide detailed results.
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
    - Explore integration with external systems
    - Test mobile responsiveness and accessibility
    - Check performance under various conditions
 
 7) Security & Compliance Testing
    - Test input validation and sanitization
    - Check for common security vulnerabilities
    - Test session management and timeout
    - Verify data encryption and privacy
    - Test access controls and permissions
    - Check compliance with industry standards
    - Test backup and recovery procedures
 
 8) Error Handling & Edge Cases
    - Test application behavior with invalid inputs
    - Check error message clarity and helpfulness
    - Test boundary conditions and limits
    - Verify graceful degradation under stress
    - Test recovery from various failure modes
    - Check logging and monitoring capabilities
    - Test user guidance and help systems
 
 CRITICAL REQUIREMENTS:
 - Complete ALL 8 sections thoroughly
 - Generate 30+ meaningful test actions
 - Document all findings and issues
 - Provide actionable recommendations
 - Test both positive and negative scenarios
 - Focus on real user workflows and pain points
 `
     }
   },
 
   // --- Teaching Channel ---
   teachingChannel: {
     prompts: {
       smoke: `
 This is my URL : https://passageprepstg.wpenginepowered.com/ I want to do smoke test on it Basic auth username : passageprepstg and password is : 777456c1 Will you be able to do it ?
 
 Please execute a comprehensive smoke test including:
 
 1) Navigate to the URL with basic auth
 2) Test the login functionality 
 3) Verify page elements load correctly
 4) Check for any errors or issues
 5) Take screenshots at key moments
 6) Report findings and any problems discovered
 
 Execute this test thoroughly and provide detailed results.
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
    - Explore integration with external systems
    - Test mobile responsiveness and accessibility
    - Check performance under various conditions
 
 7) Security & Compliance Testing
    - Test input validation and sanitization
    - Check for common security vulnerabilities
    - Test session management and timeout
    - Verify data encryption and privacy
    - Test access controls and permissions
    - Check compliance with industry standards
    - Test backup and recovery procedures
 
 8) Error Handling & Edge Cases
    - Test application behavior with invalid inputs
    - Check error message clarity and helpfulness
    - Test boundary conditions and limits
    - Verify graceful degradation under stress
    - Test recovery from various failure modes
    - Check logging and monitoring capabilities
    - Test user guidance and help systems
 
 CRITICAL REQUIREMENTS:
 - Complete ALL 8 sections thoroughly
 - Generate 30+ meaningful test actions
 - Document all findings and issues
 - Provide actionable recommendations
 - Test both positive and negative scenarios
 - Focus on real user workflows and pain points
 `
     }
   }
 }
 