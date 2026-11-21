# PROJECT: TABLE & TALE — C++ RESTAURANT MANAGEMENT SYSTEM TO PROFESSIONAL WEBSITE

## 1. ROLE

Act as a Principal Software Architect, Senior Full-Stack Engineer, C++ Integration Specialist, UI/UX Designer, Performance Engineer, and QA Engineer.

You are responsible for transforming an existing C++ Restaurant Management System into a fully functional, professional, responsive web application.

Work with engineering discipline. Do not behave like an AI website generator that produces attractive but incomplete interfaces.

Prioritize existing functionality, accurate design reproduction, maintainability, performance, and working functionality.

## 2. TASK

Transform my existing C++ Restaurant Management System into a complete website while preserving its original business logic, features, design identity, and functionality.

The website should look professionally designed, visually polished, balanced, and production-quality while remaining faithful to the supplied project.

The final result must be runnable locally without broken images, missing assets, nonfunctional buttons, routing errors, or incomplete features.

## 3. PROJECT CONTEXT AND SOURCE OF TRUTH

I will provide:

1. A ZIP file containing my existing C++ project.
2. Original C++ source code.
3. Existing project images and other assets.
4. Original visual design reference images containing the intended website appearance, colors, and design elements.

IMPORTANT:

Treat the uploaded ZIP and visual references as the primary source of truth.

Before making any changes:

- Extract and inspect the complete project structure.
- Read all relevant C++ source and header files.
- Understand the existing classes, functions, menus, data structures, business logic, and workflows.
- Identify every existing feature and its dependencies.
- Inspect all supplied images, design references, and assets.
- Identify how the existing application stores and manages data.
- Understand the current execution and compilation requirements.

Never assume a feature exists without finding evidence in the source code.

Never remove, replace, simplify, or invent existing functionality without explicit justification and approval.

## 4. FEATURE PRESERVATION

The existing C++ application defines the functional scope.

Create a complete feature inventory before implementation.

For every existing feature, document:

- Feature name.
- Existing C++ implementation.
- User interaction.
- Required input.
- Expected output.
- Related classes and functions.
- Data dependencies.
- Web interface requirements.
- Testing requirements.

Every existing feature must have a corresponding working web interface.

Do not introduce unrelated features simply to make the website appear more advanced.

You may improve usability, navigation, responsiveness, feedback messages, and visual presentation without changing the original business rules.

Do not duplicate C++ business logic in JavaScript.

C++ must remain responsible for the original business operations wherever technically feasible.

## 5. DESIGN AND VISUAL IDENTITY

Reproduce the original design references as closely as possible.

Preserve:

- Original color palette.
- Brand identity.
- Main visual style.
- Typography direction.
- Background colors.
- Buttons and component styling.
- Image presentation.
- Overall visual composition.

Premium refinement is allowed.

You may improve:

- Typography hierarchy.
- Spacing consistency.
- Component alignment.
- Visual balance.
- Card layouts.
- Navigation.
- Responsive behavior.
- Subtle transitions and animations.
- Hover and focus states.
- Accessibility and readability.

However, these refinements must enhance the original design rather than replace it.

Do not introduce a completely different theme.

Avoid generic AI-generated website aesthetics.

STRICTLY AVOID:

- Excessive gradients.
- Unnecessary glassmorphism.
- Random glowing effects.
- Excessive rounded cards.
- Too many decorative elements.
- Unnecessary animations.
- Oversized hero sections.
- Repeated identical layouts across every page.
- Excessive empty space.
- Generic AI dashboard templates.
- Inconsistent colors and typography.

The result should feel like a carefully designed real restaurant management product, not an automatically generated template.

## 6. IMAGE AND ASSET MANAGEMENT — CRITICAL REQUIREMENT

Image loading problems on localhost must be prevented.

This is one of the highest-priority technical requirements.

First inspect every supplied image and determine its correct purpose.

Implement reliable asset management:

- Maintain a centralized asset directory.
- Use predictable and consistent file naming.
- Use correct relative paths or framework-supported asset imports.
- Avoid Windows-specific absolute paths.
- Avoid hardcoded development machine paths.
- Avoid broken external image dependencies.
- Avoid relying on temporary AI Studio preview URLs.
- Avoid referencing images that do not exist.
- Avoid incorrect filename casing.
- Ensure all image references work from the project root.

If using Vite, follow the correct distinction between the public directory and imported source assets.

If using another build system, follow its recommended asset handling.

For every image:

1. Verify that the actual file exists.
2. Verify its referenced path.
3. Verify that the browser can load it.
4. Check its dimensions and display behavior.
5. Implement appropriate aspect ratios and object-fit behavior.
6. Provide a graceful fallback for genuinely missing optional images.

Create an asset inventory containing:

- Image filename.
- Actual file location.
- Intended usage.
- Referencing page or component.
- Loading verification status.

Do not use placeholder images when original assets are available.

Do not silently replace supplied images with unrelated stock images.

## 7. TECHNOLOGY AND ARCHITECTURE

Prefer simple, maintainable, and appropriate technologies.

Frontend preference:
- HTML5
- CSS3
- JavaScript

Frameworks may be considered only if the existing project or integration requirements justify them.

Backend:
- Preserve the existing C++ business logic.
- Inspect the existing application before selecting an integration method.
- Evaluate an appropriate C++ HTTP/API integration layer if required.
- Use structured JSON communication where appropriate.

IMPORTANT:

A browser cannot directly execute a normal console-based C++ application as a backend.

Design a proper communication layer between the browser and C++ application.

Do not replace C++ logic with mock JavaScript functionality.

Do not create a new database or change storage architecture without first understanding the existing implementation and documenting the reason.

Keep the architecture modular and easy to understand.

## 8. PERFORMANCE AND SCALABILITY

The website must be optimized for practical performance.

Requirements:

- Minimize unnecessary dependencies.
- Avoid duplicate code.
- Avoid unnecessary API requests.
- Optimize image sizes.
- Use lazy loading for appropriate below-the-fold images.
- Prevent layout shifts caused by images.
- Avoid unnecessary JavaScript execution.
- Use efficient event handling.
- Keep CSS organized.
- Avoid memory leaks.
- Implement appropriate error handling.
- Maintain responsive layouts.
- Keep the application easy to extend.

Do not sacrifice maintainability for premature optimization.

## 9. RESPONSIVE DESIGN

The complete website must work on:

- Desktop.
- Laptop.
- Tablet.
- Mobile phones.

All pages, navigation elements, forms, tables, menus, images, and interactive components must adapt correctly.

Do not simply shrink the desktop interface.

Design appropriate responsive layouts.

## 10. DEVELOPMENT WORKFLOW — STRICTLY FOLLOW

Do not generate the complete application in one step.

Follow these phases in order.

### PHASE 1 — COMPLETE PROJECT AUDIT

Inspect the ZIP and provide:

1. Existing project structure.
2. Complete feature inventory.
3. C++ architecture analysis.
4. Existing data storage analysis.
5. Image and asset inventory.
6. Existing design analysis.
7. Technical limitations.
8. Potential integration challenges.
9. Missing or broken dependencies.
10. Risks and recommended solutions.

Do not modify source files during this phase.

Deliver an evidence-based audit report.

### PHASE 2 — REQUIREMENTS AND DOCUMENTATION

Prepare these project documents:

- PRD.md
- FEATURE_INVENTORY.md
- ARCHITECTURE.md
- UI_UX_DESIGN.md
- ASSET_MANIFEST.md
- API_CONTRACT.md
- IMPLEMENTATION_PLAN.md
- TESTING_PLAN.md

Keep documentation concise, consistent, and based on the actual source project.

Do not invent requirements.

### PHASE 3 — ARCHITECTURE AND INTEGRATION

Finalize:

- Frontend architecture.
- C++ integration approach.
- API contracts.
- Data flow.
- Error handling.
- Asset management.
- Folder structure.
- Local development setup.
- Build and execution commands.

Explain the integration strategy before implementing it.

### PHASE 4 — DESIGN APPROVAL

Use the supplied visual references.

Define the final:

- Color tokens.
- Typography system.
- Spacing system.
- Component styles.
- Navigation.
- Page layouts.
- Responsive behavior.
- Animation guidelines.

If a design prototype is needed, build and review it before implementing the complete application.

Do not create an unrelated alternative design.

### PHASE 5 — IMPLEMENTATION

Implement the website in small, controlled modules.

Recommended order:

1. Project setup and configuration.
2. Asset management.
3. Global styles and design system.
4. Navigation and shared components.
5. Main pages.
6. Existing feature interfaces.
7. C++ integration.
8. Data handling.
9. Forms and user interactions.
10. Responsive refinements.
11. Error and loading states.

Implement only verified requirements.

After each module:

- Inspect the changed files.
- Check existing functionality.
- Run the application.
- Resolve errors.
- Verify image loading.
- Test related interactions.

Do not rewrite unrelated working components.

### PHASE 6 — COMPLETE TESTING

Test the application from a real local development environment.

Verify:

- Application starts successfully.
- All pages load.
- All navigation links work.
- All images load.
- All buttons perform their intended actions.
- All forms validate correctly.
- Existing C++ functionality works through the website.
- Data is handled correctly.
- No unexpected data loss occurs.
- No broken routes exist.
- No console errors remain.
- No missing assets remain.
- No critical responsive layout problems remain.

Test the production build separately from the development server.

### PHASE 7 — FINAL QUALITY AUDIT

Perform a complete audit of:

- Feature completeness.
- C++ business logic preservation.
- Design accuracy.
- Visual consistency.
- Image loading.
- Frontend/backend integration.
- Performance.
- Accessibility.
- Responsive behavior.
- Security.
- Maintainability.

Provide a final report with:

- Completed features.
- Verified features.
- Remaining issues.
- Known limitations.
- Commands to run locally.
- Build instructions.

Never claim something works unless it has actually been tested.

## 11. ENGINEERING RULES

1. Never delete original C++ source files without approval.
2. Never overwrite working functionality unnecessarily.
3. Never create duplicate components or duplicate business logic.
4. Never generate unnecessary files.
5. Never use fake data to simulate a completed feature.
6. Never hide errors instead of fixing their root cause.
7. Never hardcode machine-specific file paths.
8. Never expose API keys or secrets.
9. Never modify unrelated project files.
10. Never perform a complete rewrite when a controlled integration is sufficient.
11. Keep Git changes modular and recoverable.
12. Maintain clear naming conventions and readable code.

## 12. QUALITY BAR — DEFINITION OF DONE

The project is complete only when:

- Every original feature is accounted for.
- Existing C++ functionality is preserved.
- The supplied design identity is respected.
- The website looks professionally refined.
- Every required page and component is implemented.
- Every interactive element works.
- Images load correctly on localhost.
- The backend and frontend communicate correctly.
- No critical console or runtime errors remain.
- The production build succeeds.
- The project can be run using documented commands.
- The codebase remains understandable and maintainable.

## 13. FIRST RESPONSE INSTRUCTION

Start with PHASE 1 only.

Inspect the uploaded ZIP and design references thoroughly.

Do not generate code yet.

Do not redesign the website.

Do not make assumptions about missing features.

Return a structured audit report and wait for my approval before proceeding to the next phase.

Your priority is not generating the largest amount of code.

Your priority is delivering a faithful, complete, reliable, maintainable, and professionally executed transformation of my existing C++ Restaurant Management System.