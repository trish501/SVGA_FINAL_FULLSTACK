Design a production-ready login experience for the SVGA Book Bank website, keeping it visually consistent with the existing SVGA Book Bank style, pastel light theme, minimal clean layout, soft shadows, rounded cards, and bright mode only.

Use the uploaded admin login reference as the base for the admin page structure, and use the uploaded student login reference as the base for the student page structure. Keep the overall UI polished, modern, and student-friendly.

GENERAL STYLE RULES
- Use soft pastel colors only.
- Bright mode only.
- No dark mode.
- No 3D effects.
- Keep the interface 2D, clean, and minimal.
- Use subtle glassmorphism for cards and panels.
- Add soft shadows, rounded corners, and light borders.
- Make the page feel premium and production-ready.
- Keep animations subtle and elegant, with gentle scroll or fade-in motion.
- Keep typography bold for headings and simple for form labels and helper text.

ADMIN LOGIN PAGE
Create an admin login screen that closely matches the uploaded admin login reference.

Layout:
- Top center: SVGA Book Bank logo icon.
- Below it: “SVGA Book Bank” as the main title.
- Under that: “Admin Portal” as the subtitle.
- Center of the page: a clean login card with rounded corners and soft shadow.
- Inside the card:
  - Heading: “Admin Sign In”
  - Short helper text: “Enter your administrator credentials to continue.”
  - Input 1: Username
  - Input 2: Password
  - A prominent primary “Sign In” button
  - A small restricted access notice below the button
- Below the card:
  - A small text link: “Student? Go to Student Login”
- Keep this admin page simple, secure, and focused.
- Preserve the same general structure and calm visual balance from the reference image.

STUDENT LOGIN PAGE
Create a student login page that closely follows the uploaded student login reference, but with the exact updated verification flow described below.

Layout:
- Top center: SVGA Book Bank logo icon.
- Below it: “Student Login” as the main title.
- Below that: helper text like “Verify your details to get started.”
- Center: a clean, rounded verification card with soft shadow and glassmorphism.
- Background: light pastel blue with subtle dotted or soft decorative pattern, similar to the reference.
- Keep the page spacious, bright, and clean.

STUDENT VERIFICATION FLOW
The student login flow must happen in this exact order:

1) Aadhaar Number Input
- First input box should ask for 12-digit Aadhaar number.
- Show placeholder like: “1234 5678 9012”
- Add a small helper note that Aadhaar is used for verification.

2) Email Input
- Second input box should ask for email address.
- Next to this email box, place a small clickable text/button labeled “Verify OTP”.
- When clicked, it should visually indicate that an email OTP has been sent.

3) Email OTP Input
- After email OTP is triggered, show a second OTP input box for email OTP verification.
- Keep it clean and minimal.
- Once correct OTP is entered, visually mark email verification as completed.

4) Mobile Number Input
- After email verification is complete, enable the mobile number input box.
- Show a country code prefix such as +91.
- Keep this input clearly separated and visually disabled until email verification is done.

5) Mobile OTP Verification
- After mobile number is entered, allow mobile OTP verification.
- Show a second “Verify OTP” action for mobile verification.
- After OTP is validated, visually mark mobile verification as completed.

6) Final Submit Button
- Once Aadhaar, email OTP, and mobile OTP are all verified, show the final button.
- The final button must be labeled exactly: “Get Started”
- This button should take the student to the student dashboard page after successful verification.

STUDENT PAGE UI REQUIREMENTS
- Use the same clean card style as the admin page, but with a friendlier student experience.
- Show step-like progression or visual verification status.
- Include small verified indicators for completed steps.
- Keep the form centered and easy to scan.
- Maintain consistent spacing and soft pastel styling.
- Make the flow feel secure, simple, and trustworthy.

INTERACTION AND STATE DESIGN
- Email OTP verification and mobile OTP verification should be clearly represented as separate steps.
- Show disabled states for fields that are not yet available.
- Show success states when OTP is verified.
- Show smooth transitions between steps.
- The final “Get Started” button should only appear or become active after all required verifications are complete.

UI TONE
- Minimal
- Elegant
- Soft
- Professional
- Production-ready
- Student-friendly
- Security-focused

OUTPUT EXPECTED
- Create two separate login designs:
  1. Admin Login Page
  2. Student Login Page
- Both should match the SVGA Book Bank brand.
- Both should be aligned with the existing website’s visual system.
- Use the provided references as the base layout inspiration.
- Do not add unrelated sections.
- Do not add extra pages.
- Keep the design focused only on these login flows.