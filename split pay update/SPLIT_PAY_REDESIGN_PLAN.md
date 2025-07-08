# Split Pay UI Redesign - Comprehensive Implementation Plan

## Overview
Complete UI redesign of the Split Pay section maintaining the existing soft gold and purple theme. Reference screenshots provide framework/layout structure. Comprehensive testing strategy using Puppeteer for visual validation and unit testing for functionality.

## Phase 1: Analysis & Setup
- [ ] **Analyze existing Split Pay components and structure**
- [ ] **Set up testing framework with Puppeteer and Jest**
- [ ] **Create baseline screenshots for comparison**
- [ ] **Review existing app theme (soft gold and purple) for consistency**

## Phase 2: Homepage Redesign (Screenshot 072817.png Framework)
- [ ] **Redesign Split Pay homepage with app theme**
  - Clean event list with flag icons (golf, Spain, etc.)
  - Purple add button in top-right corner (matching app theme)
  - Bottom navigation with Split Pay highlighted in purple
  - Soft gold accents and backgrounds
- [ ] **Create unit tests for homepage functionality**
- [ ] **Use Puppeteer to validate visual layout matches framework**

## Phase 3: Event Details Page (Screenshot 072858.png Framework)
- [ ] **Implement event detail view with theme consistency**
  - Event title at top with purple accents
  - Expenses/Balances toggle tabs in theme colors
  - My Expenses and Total Expenses summary with soft gold backgrounds
  - Chronological expense list with themed icons
- [ ] **Create unit tests for toggle functionality**
- [ ] **Use Puppeteer to verify layout and interactions**

## Phase 4: Add Expense Modal (Screenshot 072918.png Framework)
- [ ] **Build Add Expense modal component with app theming**
  - Title field with soft gold/purple styling
  - Currency amount selector with theme colors
  - Purple "Paid By" dropdown (defaults to current user)
  - Date picker with app styling
  - Split options (Equal/As Amount) with purple highlights
  - User selection with themed checkboxes
- [ ] **Create unit tests for form validation and submission**
- [ ] **Use Puppeteer to test modal interactions**

## Phase 5: Balances View (Screenshot 072910.png Framework)
- [ ] **Implement balances calculation view with theming**
  - User balance list with soft gold backgrounds
  - Red/green amount indicators with purple accents
  - "View All Suggested Reimbursements" link in purple
- [ ] **Create unit tests for balance calculations**
- [ ] **Use Puppeteer to validate balance display**

## Phase 6: Payment Flow (Screenshot 072929.png Framework)
- [ ] **Build payment confirmation interface with theme**
  - "You Owe" display with red/purple styling
  - Recipient details with soft gold background
  - Purple "Mark as Paid" and "Invite to See Balance" buttons
- [ ] **Create unit tests for payment state management**
- [ ] **Use Puppeteer to test payment workflow**

## Phase 7: Integration & Backend
- [ ] **Connect with Calendar for automatic event creation**
- [ ] **Implement notification system for user additions**
- [ ] **Add currency conversion functionality**
- [ ] **Create comprehensive integration tests**

## Phase 8: Final Testing & Validation
- [ ] **Run complete Puppeteer test suite**
- [ ] **Perform visual regression testing**
- [ ] **Execute end-to-end user journey tests**
- [ ] **Create PR with comprehensive test coverage**

## Design Requirements
- **Theme**: Maintain soft gold and purple color scheme throughout
- **Framework**: Reference screenshots provide layout structure, not exact colors
- **Consistency**: Match existing app styling and component patterns
- **Responsive**: Ensure mobile-first design matches app standards

## Testing Strategy
- **Unit Tests**: Jest for component logic and calculations
- **Visual Tests**: Puppeteer screenshots comparison with framework structure
- **Integration Tests**: Full user workflows from event creation to payment
- **Theme Validation**: Ensure all components match app's gold/purple theme

## Success Criteria
- All framework layouts implemented with proper app theming
- 100% test coverage for new components
- All Puppeteer visual validations passing
- Seamless integration with existing Calendar system
- Consistent soft gold and purple theme throughout

---

*This plan will be executed step by step with each task marked as completed in the todo list as progress is made.*