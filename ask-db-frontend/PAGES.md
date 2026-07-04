# AskDB - Complete Page Index

## Public Pages

### Landing Page
**URL**: `/`
**Description**: Main marketing/landing page with hero, features, timeline, and footer
**Features**:
- Navigation header with links to Features, How It Works, Contact
- Hero section with gradient text and CTA buttons
- 6 feature cards with hover animations
- 3-step timeline showing the workflow
- Footer with company links and social links

---

## Authentication Pages

### Login Page
**URL**: `/auth/login`
**Description**: User login form with email, password, remember me, and OAuth options
**Features**:
- Email input field
- Password field with "Forgot Password" link
- Remember me checkbox
- Sign In button
- Divider with "Or continue with" text
- Google OAuth button
- GitHub OAuth button
- Link to signup page
- Link back to home

### Signup Page
**URL**: `/auth/signup`
**Description**: New user registration with email, password, terms acceptance
**Features**:
- Email input field
- Password input field
- Confirm password field
- Terms & Privacy Policy checkbox (required)
- Create Account button (disabled until terms accepted)
- Divider with "Or sign up with" text
- Google OAuth button
- GitHub OAuth button
- Link to login page

### Forgot Password Page
**URL**: `/auth/forgot-password`
**Description**: Password reset flow with email input and confirmation
**Features**:
- Step 1: Email input with "Send Reset Link" button
- Step 2: Confirmation message showing email and "Try Another Email" option
- Navigation back to login

---

## Dashboard Pages

### Dashboard Home
**URL**: `/dashboard`
**Description**: Welcome screen with suggested prompts and new chat button
**Features**:
- Sidebar with collapsible toggle
- Chat history grouped by date (Today, Earlier)
- Search conversations input
- Database connection indicator
- 4 suggested prompt cards (Data Analysis, Search Data, Performance, Metrics)
- Chat input at bottom
- Settings, Theme, and Logout buttons in sidebar

### New Chat
**URL**: `/dashboard/new`
**Description**: Interactive chat interface with AI responses
**Features**:
- Full message history display
- User messages (right-aligned, blue background)
- AI messages (left-aligned, white card with action buttons)
- Timestamps on each message
- Copy, Regenerate, Like, and Dislike buttons on AI messages
- Chat input with auto-growing textarea
- Attachment and voice buttons in input
- Loading indicator ("AI is analyzing your data...")
- Same sidebar as dashboard

**Demo Chat**:
- Initial AI greeting message
- Contextual responses based on keywords (revenue, users, performance)
- Simulated 1-second response delay

### Chat History View
**URL**: `/dashboard/chat/[id]`
**Description**: View specific past conversation
**Features**:
- Same layout as New Chat
- Loads mock conversation data
- All messaging features available
- Same sidebar navigation

### Search Conversations
**URL**: `/dashboard/search`
**Description**: Search and filter past conversations by keyword, database, date
**Features**:
- Search input field
- Database filter buttons (All, PostgreSQL, MySQL, SQL Server)
- Conversation results cards showing:
  - Title
  - SQL preview
  - Database type with icon
  - Last modified time
  - Open button
- Empty state when no results found

### Settings Page
**URL**: `/dashboard/settings`
**Description**: User settings and preferences
**Features**:
- 4 tabbed sections: Profile, Appearance, API Keys, Danger Zone

#### Profile Tab
- Full Name input
- Email input
- Company input
- Save Changes button
- Change Password section with current and new password inputs
- Update Password button

#### Appearance Tab
- Theme radio buttons (Light, Dark, System)

#### API Keys Tab
- Create API Key button
- Display of existing API key (masked)
- Copy button
- Delete button

#### Danger Zone Tab
- Delete Account button (destructive styling)
- Warning message

---

## Database Pages

### Database Connection
**URL**: `/database/connect`
**Description**: Multi-step database connection wizard
**Features**:
- Step 1: Select Database Type
  - 7 database options: PostgreSQL, MySQL, SQL Server, SQLite, Oracle, MariaDB, MongoDB
  - Each with icon and name
  - Cards are clickable to proceed

- Step 2: Connection Form
  - Host input
  - Port input
  - Username input
  - Password input (hidden)
  - Database Name input
  - SSL Toggle checkbox
  - Cancel button
  - Test Connection button
  - Back button

- Step 3: Testing State
  - Loading indicator ("Testing Connection")
  - Simulated 2-second test duration

- Step 4: Success
  - Success emoji (✅)
  - Confirmation message
  - "Start Using AskDB" button
  - Back to select database button

---

## Error Pages

### 404 Not Found
**URL**: `/*` (any undefined route)
**Description**: Page not found error screen
**Features**:
- Large search icon (🔍)
- "Page Not Found" heading
- Error description
- "Go Home" button

---

## Sidebar Navigation

### Available in Dashboard
- Logo with collapse toggle
- New Chat button
- Search conversations input
- Conversation history grouped by:
  - Today
  - Earlier
- Connections section showing PostgreSQL
- Settings button
- Theme toggle button
- Logout button (red)

### Conversation Grouping
- **Today**: Current day conversations
- **Yesterday**: Yesterday's conversations
- **Last 7 Days**: Week-old conversations
- **Older**: Older conversations

---

## Interactive Features Across All Pages

### Global Navigation
- Home logo always links to "/"
- Auth pages link to "/auth/login" and "/auth/signup"
- Dashboard pages link to settings and search
- All internal links use Next.js Link component

### Form Elements
- Text inputs with placeholder text
- Password fields (hidden text)
- Checkboxes with labels
- Radio buttons for selection
- Text areas with auto-sizing
- Button states (enabled/disabled)

### Visual Feedback
- Hover effects on interactive elements
- Loading indicators (spinners, dots)
- Skeleton loaders for content
- Empty states with helpful messages
- Timestamps on messages
- Database icons for quick identification

### Design Consistency
- Consistent spacing (4px baseline)
- Unified color palette
- Matching typography
- Similar component patterns
- Smooth transitions and animations

---

## Component Library Usage

Every page uses reusable components from:
- `components/ui/` - Buttons, cards, badges, etc.
- `components/landing/` - Header, hero, features, timeline, footer
- `components/dashboard/` - Sidebar, chat messages, chat input
- `components/database/` - Connection wizard
- `components/states/` - Error screens, skeletons

---

## Testing the Application

### Quick Navigation
1. **Home**: `/` - See the landing page
2. **Signup**: `/auth/signup` - Create account flow
3. **Login**: `/auth/login` - Sign in flow
4. **Dashboard**: `/dashboard` - Main app
5. **New Chat**: `/dashboard/new` - Try the chat
6. **Connect DB**: `/database/connect` - Database wizard
7. **Settings**: `/dashboard/settings` - User preferences

### Interactive Features to Try
- Click feature cards on landing page
- Scroll through timeline section
- Fill out login/signup forms
- Click suggested prompts in dashboard
- Send a message in chat (type and press Enter or click Send)
- Try the sidebar search
- Filter by database on search page
- Toggle tabs on settings page
- Test database selection in wizard

---

## Deployment

All pages are production-ready and can be deployed to:
- Vercel (recommended)
- Netlify
- Any Node.js hosting

No backend or environment variables required for the frontend.

---

**Last Updated**: 2026
**Total Pages**: 11 pages + 1 error page
**Total Components**: 50+ reusable components
**Status**: Production Ready
