# Privacy Policy

**Effective Date:** February 27, 2026  
**Last Updated:** March 2, 2026

This Privacy Policy explains how Recipe Easy ("Recipe Easy", "we", "our", "us") collects, uses, stores, and shares information when you use our website and services.

## 1. Scope

This policy applies to:
- `recipe-easy.com` and related subpaths
- Recipe Easy web features (recipe generation, image generation, saved recipes, profile)
- Recipe Easy API routes used by the web app

## 2. Information We Collect

### 2.1 Account and Profile Information
When you sign in using email one-time verification codes (OTP) or Google OAuth (via Supabase), we may process:
- Account identifier (user ID)
- Email address
- Authentication provider data (for example, Google profile fields made available by Supabase)
- Profile metadata you set, such as display name and avatar URL

### 2.2 Recipe and Content Information
When you use product features, we may process:
- Ingredient selections and recipe preferences (servings, cooking time, vibe, cuisine, language)
- Generated recipe output
- Saved recipe content (title, description, ingredients, seasoning, instructions, tags, chef tips)
- Favorite-recipe relationships and cookbook listing metadata
- Recipe translations generated for supported locales
- Recipe image links and image model metadata
- Avatar images you upload

### 2.3 Credits and Usage Information
We use an internal credits system. We may process:
- Current credits balance
- Total earned and total spent credits
- Credit transaction records (for example: `earn`, `spend`, `daily_login_bonus`, `expire`)
- Daily login bonus metadata (grant time, expiration, remaining amount)
- Model usage records (model name/type and timestamp)

### 2.4 Technical and Diagnostic Information
Like most web services, we and our infrastructure providers may process:
- IP address and request metadata
- Browser/device/OS information
- Error logs and performance diagnostics
- Basic security and anti-abuse signals

### 2.5 Analytics and Advertising Data
Depending on environment configuration, we may use:
- Google Analytics 4 (page and traffic analytics)
- Microsoft Clarity (interaction analytics)
- Google AdSense (ads delivery and related measurement)

These providers may set or read cookies and similar technologies under their own policies.

## 3. How We Use Information

We use information to:
- Create and maintain your account
- Authenticate users and keep the service secure
- Generate recipes and images based on your input
- Save, list, update, translate, and delete recipe records
- Manage credits, including daily login bonus logic
- Support profile features (display name and avatar)
- Diagnose failures, prevent abuse, and improve reliability
- Understand traffic and feature usage trends
- Comply with legal obligations and enforce our Terms

## 4. How and Why We Share Information

We do not sell your personal information.

We may share data with service providers that process data on our behalf:
- **Supabase**: authentication and account/session infrastructure
- **Neon PostgreSQL**: application database (recipes, credits, usage records)
- **Cloudflare R2**: object storage for avatars and recipe images
- **Replicate**: AI inference endpoints used for some language/image generation
- **DashScope (Qwen/Wanx)**: AI inference endpoints used for some language/image generation
- **Vercel**: hosting and runtime infrastructure
- **Google Analytics / Microsoft Clarity / Google AdSense**: analytics and advertising features

We may also disclose information when required by law, to protect rights/safety, or in connection with a merger/acquisition/reorganization.

## 5. Data Retention

We retain data for as long as needed for service operation and legitimate business/legal purposes.

Typical retention logic:
- **Account/profile data**: while account remains active
- **Saved recipes and related metadata**: until you delete them or your account is removed
- **Avatar images in storage**: until replaced/deleted/removed as part of account lifecycle
- **Recipe images in storage**: based on storage lifecycle policy (currently up to about 7 days)
- **Credits and transaction records**: as needed for account integrity, abuse prevention, and auditing
- **Operational logs and analytics**: according to provider retention settings and legal requirements

If you request deletion, we will process the request within a reasonable period, subject to legal obligations.

## 6. Your Rights and Choices

Depending on your location and applicable law, you may have rights to access, correct, delete, or export personal data.

In-product controls currently include:
- Update display name
- Upload/replace avatar
- Delete your saved recipes
- Manage recipe favorites

For account-level data requests (access/export/deletion), contact us at `contact@recipe-easy.com`.

## 7. Cookies, Local Storage, and Similar Technologies

Recipe Easy and integrated providers may use cookies/local storage/session storage for:
- Authentication/session continuity
- Security and anti-abuse controls
- Functional UX behavior (for example, redirect state during OAuth flow)
- Analytics and ad measurement where enabled

You can control cookies via browser settings. Blocking some storage features may affect functionality.

## 8. International Data Transfers

Our providers may process data in multiple jurisdictions. By using the service, you understand that data may be transferred to and processed in countries outside your own.

## 9. Children’s Privacy

Recipe Easy is not directed to children under 13, and we do not knowingly collect personal data from children under 13.

## 10. Security

We apply reasonable technical and organizational safeguards. No internet service can guarantee absolute security.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will publish the revised version with an updated "Last Updated" date.

## 12. Contact

For privacy questions or requests:

**Email:** `contact@recipe-easy.com`  
**Subject:** `Privacy Request`
