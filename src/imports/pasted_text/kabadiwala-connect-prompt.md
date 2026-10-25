KABADIWALA CONNECT
COMPLETE FIGMA UI/UX REFINEMENT, NAVIGATION, WIREFRAME & MAP INTEGRATION MASTER PROMPT

You are a senior UI/UX designer, mobile application architect, and Figma prototype specialist.

I already have an existing Figma design for my project:

“Kabadiwala Connect – Bringing the Informal Collector into the Formal Recycling Chain.”

The existing design already has a good visual direction.

Your task is NOT to redesign the application from scratch.

Instead, use the existing Figma design as the foundation and perform a complete:

UI/UX refinement
Wireframe correction
Navigation improvement
Screen-flow correction
Back-button integration
User journey improvement
Seller/collector selection improvement
Map visualization integration
Prototype connection improvement
Accessibility and usability improvement

The final result should feel like a complete, realistic, professional mobile application prototype.

1. IMPORTANT: PRESERVE THE EXISTING DESIGN

Keep the existing:

Logo
Branding
Color palette
Typography style
Visual identity
Card designs
Buttons
Existing illustrations
Existing major screens
Existing overall layout
Existing content structure

Do not unnecessarily replace the current UI.

Only modify or add components when required to improve:

Navigation + Wireframing + User Flow + Usability + Information Hierarchy + Missing Screens + Map Integration.

The goal is to improve the existing design, not restart it.

2. MAIN WIREFRAME PROBLEM — FIX NAVIGATION

Review every existing screen.

Identify screens where the user may not know:

Where they are
How to go back
What action to take next
Where an action will lead
How to return to the previous screen

Add appropriate navigation controls.

3. BACK BUTTON SYSTEM

For secondary and inner pages, add a consistent:

← Back

button/icon in the top-left corner.

The Back button should:

Have a consistent position
Use a familiar arrow icon
Have a sufficiently large touch area
Match the existing UI style
Clearly return to the previous logical screen
Not overlap with the page title

Example:

← Back Select Collector

Do not add unnecessary Back buttons to primary screens such as the main Home screen.

4. MAIN BOTTOM NAVIGATION

For major sections, use a consistent bottom navigation bar.

Recommended structure:

Home | Sell/Schedule | Track | Marketplace | Profile

Use only 4–5 major destinations.

The active destination should be visually highlighted.

Do not use bottom navigation on every screen.

5. DO NOT SHOW BOTTOM NAVIGATION ON INNER WORKFLOW SCREENS

For screens such as:

Waste selection
Collector selection
Address selection
Pickup details
Time-slot selection
Add address
Edit profile
Confirmation
Transaction details
Help pages

Use contextual navigation such as:

← Back

instead of the main bottom navigation.

This makes the workflow feel more natural.

6. COMPLETE USER FLOW

Create a logical end-to-end flow.

The main waste-selling/pickup journey should approximately follow:

Home

↓

Sell / Schedule Pickup

↓

Select Waste Type

↓

Enter Waste Details

↓

Select Seller / Collector

↓

View Seller / Collector Details + Map

↓

Select Address

↓

Select Pickup Date & Time

↓

Confirm Pickup

↓

Pickup Scheduled

↓

Track Pickup

↓

Completed

Every screen must have a logical way to move forward or backward.

7. SELLER / COLLECTOR SELECTION — IMPORTANT

This is a major feature.

When the user chooses to sell or schedule pickup, provide a screen where they can view available:

Sellers / Kabadiwalas / Informal Waste Collectors

Each seller/collector card should contain useful information such as:

Name
Profile image/avatar
Rating
Distance
Estimated pickup time
Waste categories accepted
Approximate price/value indicator where appropriate
Availability status
Verification indicator if applicable
Select/View Details button

Example:

Ramesh Kabadi Services

⭐ 4.7

📍 1.8 km away

♻ Paper • Plastic • Metal

🕐 Available today

View Details

8. MAP MUST BE INCLUDED IN SELLER/COLLECTOR SELECTION

When the user selects a seller/collector or opens their details, show a map visualization.

The map should visually communicate:

User Location ↔ Seller/Collector Location

The map should include:

User location marker
Seller/collector location marker
Simple route/path between them
Nearby road/map elements
Distance indicator
Location labels where appropriate

Example:

Your Location 📍

──────── route ────────

Collector 📍

1.8 km away

The map should occupy a meaningful portion of the screen without hiding the important seller information.

9. MAP SCREEN DESIGN

Create a realistic-looking map UI mockup suitable for a Figma prototype.

Since this stage is only UI/prototyping:

DO NOT connect a real map API.

Do not require:

Google Maps API
Mapbox API
Real-time GPS
Live location
Real database
Real geolocation

Instead, create a visually convincing static/mock map component.

The map can contain:

Roads
Local streets
Area labels
Parks/buildings represented visually
User marker
Collector marker
Route line
Distance label

The map should clearly look like a map interface while remaining a UI prototype.

10. SELLER DETAIL SCREEN

When the user taps a seller/collector card:

Open a dedicated:

Seller / Collector Details

screen.

Recommended layout:

Top

← Back

Collector Details

Map

Large map section showing:

📍 User

──── route ────

📍 Collector

Below Map

Collector profile:

Ramesh Kabadi Services

⭐ 4.7

📍 1.8 km away

Available Today

Accepted Materials

♻ Plastic

♻ Paper

♻ Metal

♻ Cardboard

Pickup Information

Estimated pickup:

30–45 minutes

Actions

Select Collector

Contact Collector

The primary action should be visually prominent.

11. MAP + SELLER CARD RELATIONSHIP

The map should not feel like a random decorative image.

It must have a clear functional purpose.

The user should immediately understand:

“This is where the collector is located and how far they are from me.”

The map should therefore appear:

During collector selection, or
On the collector detail screen, or
Both where appropriate.

Do not overload the screen with multiple unnecessary maps.

12. MULTIPLE COLLECTORS

If multiple collectors are available, the selection screen can contain:

Map

Show several collector markers:

📍 Collector A

📍 Collector B

📍 Collector C

Then below or alongside the map:

Collector cards.

For example:

Ramesh Kabadi Services

1.8 km • ⭐ 4.7

Select

Green Scrap Collectors

2.4 km • ⭐ 4.5

Select

The selected collector should be visually highlighted.

13. MAP FILTER / LOCATION CONTROLS

Where appropriate, include simple map controls such as:

+

−

Current Location

Do not overcomplicate the map.

These controls are primarily visual for the prototype.

14. MAP INFORMATION CARD

Consider adding a compact bottom card over the map:

Ramesh Kabadi Services

📍 1.8 km away

⭐ 4.7

View Details

This creates a familiar map-based selection experience.

15. PICKUP FLOW

After selecting the collector:

Select Collector

↓

Select Address

↓

Select Date & Time

↓

Review Pickup

↓

Confirm Pickup

↓

Pickup Scheduled

Each step should clearly show the current stage.

16. MULTI-STEP PROGRESS INDICATOR

For multi-step workflows, use a simple progress indicator.

Example:

1 Waste → 2 Collector → 3 Address → 4 Time → 5 Confirm

The current step should be clearly highlighted.

Allow users to go back to earlier steps where appropriate.

17. PRESERVE USER INPUT

When users press Back:

Do not unnecessarily clear their information
Preserve selected waste type
Preserve quantity/details
Preserve selected collector
Preserve selected address
Preserve selected date/time
Preserve uploaded images where appropriate

The user should not have to restart the entire process.

18. CANCEL FUNCTION

Use:

← Back

for normal navigation.

Use:

Cancel

when the user wants to exit an active process.

If cancellation may cause data loss, show:

Discard Pickup Request?

Buttons:

Keep Editing

Discard

19. CONFIRMATION SCREEN

After completing a pickup request, create a clear confirmation screen.

Example:

✓

Pickup Scheduled Successfully

Pickup ID:

KC10245

Collector:

Ramesh Kabadi Services

Date:

24 September

Time:

10:00 AM – 12:00 PM

Location:

Selected Address

Buttons:

Track Pickup

Back to Home

20. TRACK PICKUP SCREEN

Create a clear tracking interface.

Example:

Track Pickup

Pickup ID:

KC10245

Status:

Collector Assigned

Timeline:

✓ Request Created

✓ Pickup Confirmed

● Collector Assigned

○ Collector Arriving

○ Waste Collected

○ Completed

Where appropriate, show a small map with the collector's location.

Buttons:

Contact Collector

View Pickup Details

21. PROFILE NAVIGATION

Profile should contain:

Personal Information
My Addresses
Pickup History
Transactions
Notifications
Help & Support
Settings
Logout

Each item should have a clear chevron:

>

Every opened sub-page should contain:

← Back

22. MARKETPLACE NAVIGATION

Marketplace should follow:

Marketplace

↓

Search / Categories

↓

Product Listing

↓

Product Details

↓

Seller Information

↓

Transaction / Confirmation

Every inner screen must have a clear way to return.

23. SEARCH AND FILTERS

Where applicable, include:

Search

Filter

Sort

Filter screen example:

← Back

Filters

Category

Material Type

Price

Distance

Availability

Clear All

Apply Filters

24. EMPTY STATES

Do not leave blank screens.

Examples:

No Pickup History

No pickup history yet

Your completed pickups will appear here.

Schedule a Pickup

No Notifications

You're all caught up!

No Marketplace Results

No listings found

Try changing your search or filters.

25. ERROR STATES

Create basic error states where required.

Example:

Unable to schedule pickup

Something went wrong. Please try again.

Try Again

Go Back

26. AUTHENTICATION FLOW

Use:

Splash

↓

Login / Sign Up

↓

OTP / Verification

↓

Profile Setup

↓

Home

Keep authentication screens clean.

Do not add unnecessary navigation elements.

27. ACCESSIBILITY

The application is intended for a wide range of users, including informal waste collectors and users who may not be highly familiar with complex applications.

Therefore:

Use simple language
Use recognizable icons
Keep buttons large enough to tap
Avoid tiny text
Maintain adequate spacing
Use clear labels
Avoid overcrowded screens
Keep navigation predictable
Maintain good visual hierarchy

The app should feel easy for a first-time user.

28. CONSISTENT ICONOGRAPHY

Use one consistent icon style throughout the application.

Navigation icons can include:

Back
Forward
Home
Search
Notification
Profile
Location
Calendar
Camera
Upload
Edit
Delete
Help
Settings
Logout

Maintain consistent:

Size
Stroke weight
Alignment
Visual style
29. RESPONSIVE WIREFRAMING

Audit all screens for:

Overlapping elements
Incorrect spacing
Misaligned icons
Cut-off text
Buttons extending outside containers
Inconsistent margins
Inconsistent card sizes
Incorrect header alignment
Incorrect bottom navigation placement

Fix these issues while preserving the existing design.

30. FIGMA PROTOTYPE CONNECTIONS

Connect the screens logically in the Figma prototype.

Important connections:

Main Flow

Home
→ Sell/Schedule
→ Waste Selection
→ Waste Details
→ Collector Selection
→ Collector Details + Map
→ Address
→ Date & Time
→ Review
→ Confirmation
→ Track Pickup

Back Flow

Collector Details
→ Collector Selection

Address
→ Collector Details

Date & Time
→ Address

Review
→ Date & Time

Confirmation
→ Home / Track Pickup

Every Back button must return to the correct previous logical screen.

31. BOTTOM NAVIGATION CONNECTIONS

Connect:

Home → Home

Sell/Schedule → Sell/Schedule

Track → Track

Marketplace → Marketplace

Profile → Profile

The currently selected navigation item should remain visually active.

32. MAP PROTOTYPE CONNECTIONS

When the user taps a collector:

Collector Card

↓

Collector Details

↓

Display:

Map + Collector Information

↓

Select Collector

↓

Address Selection

The map itself does not need live interaction at this stage.

It is a visual prototype representation.

33. DO NOT ADD REAL DATA OR BACKEND

This Figma version is strictly for:

UI + UX + Wireframe + Prototype

Do NOT add:

Real database
Real API
Real GPS
Real Google Maps integration
Real authentication backend
Real payment gateway
Real datasets
Backend logic

Use realistic mock information only to demonstrate the interface.

34. DO NOT OVER-DESIGN

Avoid unnecessary:

Animations
Decorative elements
Excessive gradients
Too many cards
Too many popups
Complicated menus
Unnecessary screens
Excessive navigation options

The design philosophy should be:

Simple + Clear + Useful + Professional

35. FINAL COMPLETE UX AUDIT

After modifying the design, check the complete application from the user's perspective.

Ask:

Navigation
Can the user always go back?
Are Back buttons consistently positioned?
Is bottom navigation used only for major sections?
Wireframe
Are all elements aligned?
Are there overlapping components?
Are buttons accessible?
Are headers consistent?
User Flow
Can a user complete a pickup from beginning to end?
Are any screens disconnected?
Are there any dead ends?
Seller/Collector
Can the user compare collectors?
Can the user open collector details?
Is the collector's location visible?
Is there a clear map?
Is distance visible?
Can the user select the collector?
Map
Does the map clearly show user and collector locations?
Is the route understandable?
Is the map visually integrated into the UI rather than appearing as an unrelated image?
Prototype
Do buttons lead to the correct screens?
Do Back buttons work logically?
Does bottom navigation work?
Does collector selection lead to collector details?
Does collector detail lead to address selection?
Does confirmation lead to tracking?
FINAL DESIGN REQUIREMENT

The finished Figma project should feel like a single connected application, not a collection of individual screens.

The user should always understand:

WHERE AM I?

WHAT CAN I DO HERE?

HOW DO I GO BACK?

WHAT HAPPENS NEXT?

WHERE IS THE COLLECTOR/SELLER LOCATED?

HOW FAR AWAY IS THE COLLECTOR?

The most important new requirement is:

SELLER / COLLECTOR LOCATION MAP

Whenever a user selects or views a seller/collector, provide a visually clear map showing:

User Location 📍

↓

Route

↓

Seller / Collector Location 📍

along with:

Distance + Collector Name + Relevant Details

Use a static/mock map for the Figma prototype and do not introduce real API/backend functionality.

Finally, perform a complete navigation and wireframe audit and fix any remaining dead ends, missing Back buttons, disconnected screens, inconsistent navigation, or confusing user flows while preserving the existing Kabadiwala Connect visual identity.