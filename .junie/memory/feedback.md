[2026-03-13 02:22] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Requirement clarification",
    "EXPECTATION": "The user wants the photo to be minimized visually and also downscaled to the lowest practical resolution to reduce file size and improve performance after clicking 'Estimar peso', for both imported and captured photos.",
    "NEW INSTRUCTION": "WHEN user clicks 'Estimar peso' with a photo loaded THEN downscale and compress image to minimal resolution and replace original"
}

[2026-03-13 02:48] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Market quotes source",
    "EXPECTATION": "Keep the section named 'Mercado RS' showing UFRGS quotes first, then add Scot quotes afterward.",
    "NEW INSTRUCTION": "WHEN modifying the 'Mercado RS' quotes section THEN show UFRGS first and append Scot data"
}

[2026-03-13 03:34] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Section naming and order",
    "EXPECTATION": "Keep the section named 'Mercado RS' and show UFRGS quotes first, then Scot quotes.",
    "NEW INSTRUCTION": "WHEN modifying the 'Mercado RS' quotes section THEN show UFRGS first and append Scot data"
}

[2026-03-13 03:35] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Section naming",
    "EXPECTATION": "Replace the label 'Scot Consultoria' with 'SEPEA' in the quotes section.",
    "NEW INSTRUCTION": "WHEN showing the Scot quotes section THEN label the section as 'SEPEA'"
}

[2026-03-13 04:05] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "Processing mode",
    "EXPECTATION": "Use only cloud-based weight estimation across the app until the user confirms TFLite is ready.",
    "NEW INSTRUCTION": "WHEN estimating weight AND TFLite not explicitly approved THEN route all requests to cloud service"
}

[2026-03-13 04:22] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "Deployment confirmation",
    "EXPECTATION": "User is satisfied that the changes were pushed to GitHub and the success was explicitly confirmed.",
    "NEW INSTRUCTION": "WHEN pushing changes to GitHub THEN state success clearly and note Render auto-deploy"
}

[2026-03-13 04:22] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "Verification success",
    "EXPECTATION": "User confirms the TFLite export script was created and structurally validated.",
    "NEW INSTRUCTION": "WHEN creating or updating ML scripts THEN add a 'Verification' confirming file creation and validation"
}

[2026-03-13 04:58] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Detection threshold and storage",
    "EXPECTATION": "Increase the confidence threshold to 0.60 when drawing boxes on fences and save the detection results using Dexie.js.",
    "NEW INSTRUCTION": "WHEN drawing boxes for fence detections THEN use 0.60 threshold and persist to Dexie"
}

[2026-03-13 05:26] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "Processing mode confirmation",
    "EXPECTATION": "Begin using TFLite for weight estimation now that the user has confirmed it is ready; stop forcing cloud-only.",
    "NEW INSTRUCTION": "WHEN estimating weight AND user confirmed TFLite ready THEN use TFLite locally and skip cloud"
}

[2026-03-14 21:20] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Startup blank screen",
    "EXPECTATION": "The app should open and render the initial screen instead of staying on a white screen.",
    "NEW INSTRUCTION": "WHEN app launches THEN ensure it navigates to the initial screen, never stay blank"
}

[2026-03-14 22:06] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "Processing mode",
    "EXPECTATION": "Temporarily disable TFLite and use only cloud-based weight estimation across the app.",
    "NEW INSTRUCTION": "WHEN estimating weight THEN skip TFLite and route to cloud service"
}

