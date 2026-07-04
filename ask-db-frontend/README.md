# AskDB - Premium SaaS Frontend

A modern, production-ready SaaS frontend for AskDB, an AI-powered SQL assistant. Built with Next.js 16, Tailwind CSS 4, and shadcn/ui components.

## Design System

### Color Palette

- **Primary**: Blue (#3b82f6) - Main CTA and interactions
- **Secondary**: Subtle Gray (#f3f4f6) - Backgrounds and muted elements
- **Accent**: Purple (#7c3aed) - Highlights and premium features
- **Destructive**: Red (#ef4444) - Danger actions
- **Neutral**: White, grays, and blacks for text and borders

### Typography

- **Font Family**: Inter (system-ui fallback)
- **Headings**: Bold tracking-tight for visual hierarchy
- **Body**: Regular weight with 1.4-1.6 line height for readability
- **Sizes**: h1 5xl, h2 3xl, h3 2xl, h4 xl

### Components

- **Buttons**: Primary (solid), Secondary (outline), Ghost (minimal)
- **Cards**: Elevated shadow, border, smooth hover states
- **Forms**: Large inputs, clear labels, validation states
- **Chat Interface**: Message bubbles, timestamps, action buttons
- **Sidebar**: Collapsible with smooth transitions

## Project Structure

```
app/
├── page.tsx                      # Landing page
├── auth/
│   ├── login/page.tsx           # Login page
│   ├── signup/page.tsx          # Signup page
│   └── forgot-password/page.tsx # Password reset
├── dashboard/
│   ├── page.tsx                 # Dashboard welcome
│   ├── new/page.tsx             # New chat interface
│   ├── chat/[id]/page.tsx       # Chat history view
│   ├── search/page.tsx          # Search conversations
│   ├── settings/page.tsx        # User settings
│   └── layout.tsx               # Dashboard layout
├── database/
│   └── connect/page.tsx         # Database connection wizard
└── layout.tsx                    # Root layout

components/
├── ui/                          # Reusable UI primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── spinner.tsx
│   ├── skeleton.tsx
│   ├── empty-state.tsx
│   ├── logo.tsx
│   └── premium-card.tsx
├── landing/                     # Landing page sections
│   ├── header.tsx
│   ├── hero.tsx
│   ├── features.tsx
│   ├── timeline.tsx
│   └── footer.tsx
├── dashboard/                   # Dashboard components
│   ├── sidebar.tsx
│   ├── chat-message.tsx
│   └── chat-input.tsx
├── database/                    # Database components
│   └── connection-wizard.tsx
└── states/                      # Error and empty states
    ├── error-screen.tsx
    └── skeleton-loaders.tsx
```

## Key Features

### Landing Page
- Sticky header with navigation
- Hero section with gradient text
- Feature cards with hover animations
- 3-step timeline section
- Footer with links and socials

### Authentication
- Clean login/signup forms
- Social OAuth buttons (Google, GitHub)
- Password reset flow
- Remember me functionality
- Terms acceptance checkbox

### Dashboard
- Left sidebar with collapsible chat history
- Grouped conversations by date
- Database connection indicator
- Quick settings and theme toggle
- Search conversations functionality

### Chat Interface
- Real-time message display
- User messages (right-aligned, blue)
- AI messages (left-aligned, card-styled)
- Action buttons (Copy, Regenerate, Like, Dislike)
- Auto-growing textarea input
- Typing indicator animation
- Timestamp on each message

### Database Connection
- 7 supported databases (PostgreSQL, MySQL, SQL Server, etc.)
- Multi-step connection wizard
- Form validation
- Connection testing
- SSL toggle
- Success animation

### Settings
- Profile management
- Password change
- Theme selection
- API key management
- Danger zone for account deletion

## Design Highlights

### Animations
- Smooth 200-300ms transitions on all interactive elements
- Hover elevation effects on cards
- Loading state indicators
- Skeleton loaders for perceived performance

### Typography
- Text balance and proper line heights
- Semantic heading hierarchy
- Clear visual hierarchy with font weights
- Readable contrast ratios

### Spacing
- 4px base spacing unit
- Consistent padding/margin using Tailwind scale
- Proper whitespace for visual breathing room

### Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Focus states on all interactive elements
- Screen reader optimized
- Color contrast compliant

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

Currently no external integrations required. This is a frontend-only demo.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Performance

- Next.js 16 with Turbopack bundler
- React Compiler enabled for optimization
- CSS-in-JS via Tailwind for minimal bundle
- Lazy loading images and code splitting
- Web Vitals optimized

## Customization

### Colors
Edit `/app/globals.css` to modify the design tokens:
```css
:root {
  --primary: #3b82f6;
  --secondary: #f3f4f6;
  /* ... other tokens */
}
```

### Fonts
Modify the font imports in `/app/layout.tsx`:
```tsx
import { YourFont } from 'next/font/google';
```

### Components
All shadcn/ui components can be extended in `/components/ui/`

## Production Deployment

1. Connect to Vercel via GitHub
2. Set environment variables (if any)
3. Deploy with `vercel deploy`
4. Monitor Web Vitals in Vercel Analytics

## License

MIT

## Support

For issues or questions, contact support@askdb.com or visit our documentation at docs.askdb.com

---

**Built with Next.js, Tailwind CSS, and love for great UI/UX.**
