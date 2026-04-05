# Frontend CSS Structure

## Organized CSS Files by Component

Your frontend now has dedicated CSS files for each page/component for easy styling management:

### 📄 CSS Files Created:

1. **`src/components/LandingPage.css`**
   - Styles for the landing page
   - Includes: Navigation, Hero section, Stats, Announcements, Features, CTA, Footer
   - Classes use prefix: `.landing-*`

2. **`src/components/VotingDashboard.css`**
   - Styles for the voter voting interface
   - Includes: Header, Voter Info, Candidates grid, Confirmation modal, Success state
   - Classes use prefix: `.voting-*`

3. **`src/components/AdminDashboard.css`**
   - Styles for the admin control panel
   - Includes: Navigation, Status alerts, Stats grid, Results, Action cards
   - Classes use prefix: `.admin-*`

4. **`src/components/Login.css`**
   - Shared styles for both voter and admin login pages
   - Includes: Login form, Error messages, Verification section
   - Classes use prefix: `.login-*`

## Component Imports

Each component now imports its CSS file:

```jsx
// LandingPage.jsx
import './LandingPage.css';

// VotingDashboard.jsx
import './VotingDashboard.css';

// AdminDashboard.jsx
import './AdminDashboard.css';

// VoterLogin.jsx & AdminLogin.jsx
import './Login.css';
```

## How to Edit Styles

### To modify Landing Page styling:
- Edit `src/components/LandingPage.css`
- Look for classes starting with `.landing-*`

### To modify Voting Dashboard styling:
- Edit `src/components/VotingDashboard.css`
- Look for classes starting with `.voting-*`

### To modify Admin Dashboard styling:
- Edit `src/components/AdminDashboard.css`
- Look for classes starting with `.admin-*`

### To modify Login Page styling:
- Edit `src/components/Login.css`
- Look for classes starting with `.login-*`

## Class Naming Convention

All CSS files follow a consistent naming pattern:
- `.[component-name]-[element]-[modifier]`
- Example: `.voting-candidate-card`, `.admin-stat-value`, `.landing-hero-title`

This makes it easy to:
✅ Find specific styles quickly
✅ Avoid naming conflicts
✅ Understand the component hierarchy
✅ Maintain and update styles independently

## Next Steps

1. Replace Tailwind classes with CSS classes in your components
2. Update the HTML structure to use the new CSS classes
3. Customize colors, fonts, and spacing in the CSS files

## Example: Converting a Component

**Before (Tailwind classes):**
```jsx
<button className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg">
  Start Voting
</button>
```

**After (CSS classes):**
```jsx
<button className="landing-hero-btn-primary">
  Start Voting
</button>
```

Then define in CSS:
```css
.landing-hero-btn-primary {
  padding: 1rem 2rem;
  background: linear-gradient(to right, #22c55e, #16a34a);
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}
```

This structure makes it much easier to maintain and edit styles for each page! 🎉
