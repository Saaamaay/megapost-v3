

# Multi-Tier Subscription Plan

## Overview

Your presentation defines three paid tiers replacing the current single "Pro Plan" (£20/mo). Here's the mapping:

| Plan | Price | Profiles | Platforms | Generations |
|------|-------|----------|-----------|-------------|
| **Free** (trial) | £0 | 1 | 1 | 1 post total |
| **Standard** | £10/mo | 1 | 1 | Unlimited |
| **Premium** | £20/mo | 1 | All (5) | Unlimited |
| **Professional** | £30/mo | Up to 3 | All (5) | Unlimited |

## What Needs to Change

### 1. Create Stripe Products and Prices
Create two new Stripe products/prices (Standard at £10/mo and Professional at £30/mo). The existing Pro Plan product (prod_Ty48vtBStymfFT at £20/mo) becomes the "Premium" tier.

### 2. Update the Subscription Hook
Refactor `useSubscription.ts` to replace the single `PLANS.pro` with a `PLANS` object containing all three tiers (standard, premium, professional), each mapping to their Stripe product_id and price_id. Add a computed `tier` property ("free" | "standard" | "premium" | "professional") and a `maxProfiles` / `maxPlatforms` helper so the rest of the app can check limits easily.

### 3. Enforce Platform Limits
Update `PlatformSelector` and `ContentGenerator` to receive the user's tier and enforce:
- **Free / Standard**: Only 1 platform selectable at a time (show lock icons on others)
- **Premium / Professional**: All platforms available

The Standard user can pick *which* platform they want (not hardcoded), but only one at a time.

### 4. Enforce Profile Limits
Update `BusinessSwitcher` and the "Add new business" flow to check the profile cap:
- **Free / Standard / Premium**: Max 1 profile (hide "Add new business" button)
- **Professional**: Up to 3 profiles

Show an upgrade prompt when a user tries to exceed their limit.

### 5. Update the Post Limit Logic
Modify `usePostLimit.ts` so that any paid tier (standard, premium, professional) gets unlimited posts, while free stays at 1.

### 6. Redesign Account Settings Billing Section
Replace the current binary "Free vs Pro" display with a proper pricing table showing all three tiers side-by-side, highlighting the user's current plan with a badge, and offering upgrade/downgrade buttons that call `startCheckout` with the correct price ID.

### 7. Update the Backend Functions
- **check-subscription**: Already returns `product_id` -- no changes needed. The frontend tier mapping handles everything.
- **create-checkout**: Already accepts a `priceId` parameter -- no changes needed.
- **customer-portal**: Already works for managing/cancelling -- Stripe's portal handles plan changes if configured.

### 8. Update the Hero Page and NavBar
- Replace the "PRO" badge with the tier name (Standard / Premium / Professional)
- Update the free-tier CTA and upgrade prompts to reference the new plans

---

## Technical Details

### New PLANS constant

```text
PLANS = {
  standard: {
    price_id: "<new_stripe_price>",
    product_id: "<new_stripe_product>",
    name: "Standard",
    price: "£10",
    maxProfiles: 1,
    maxPlatforms: 1,
  },
  premium: {
    price_id: "price_1T07zqCYzAdXKBHty3g6o67K",
    product_id: "prod_Ty48vtBStymfFT",
    name: "Premium",
    price: "£20",
    maxProfiles: 1,
    maxPlatforms: 5,
  },
  professional: {
    price_id: "<new_stripe_price>",
    product_id: "<new_stripe_product>",
    name: "Professional",
    price: "£30",
    maxProfiles: 3,
    maxPlatforms: 5,
  },
}
```

### Tier resolution logic
The `useSubscription` hook will derive the tier by matching the returned `product_id` against the PLANS map. If no match or not subscribed, tier = "free".

### Files to modify
- `src/hooks/useSubscription.ts` -- new PLANS structure, tier derivation, limit helpers
- `src/hooks/usePostLimit.ts` -- check any paid tier (not just isPro)
- `src/components/PlatformSelector.tsx` -- accept max platforms prop, show lock UI
- `src/components/ContentGenerator.tsx` -- pass platform limits, upgrade prompts
- `src/components/BusinessSwitcher.tsx` -- enforce profile cap with upgrade prompt
- `src/components/AccountSettings.tsx` -- multi-tier pricing table
- `src/components/NavBar.tsx` -- show tier badge instead of "PRO"
- `src/pages/Index.tsx` -- update hero references and "Add new business" gating

### Stripe setup
Two new products/prices will be created via the Stripe tools before implementation begins.

