/**
 * Starter content so a fresh install has a complete-looking site.
 * Everything here is editable (or deletable) from the admin panel.
 * Directory entries are SAMPLE placeholders: replace them with real partners before launch.
 */
import type { FaqInput, PartnerInput } from "@preseedhealer/types";

export const categories = [
  { name: "Fundraising", slug: "fundraising", description: "Raising your first cheque, structuring rounds and talking to investors." },
  { name: "Government Schemes", slug: "government-schemes", description: "Startup India, credit guarantees, grants and other public programmes." },
  { name: "Programme Updates", slug: "programme-updates", description: "News about PreSeedHealer phases, partners and events." },
];

export const posts = [
  {
    title: "How to Prepare a Pre-Seed Pitch Deck Investors Actually Read",
    slug: "pre-seed-pitch-deck-guide",
    category: "fundraising",
    excerpt:
      "Most early-stage decks get under three minutes of attention. Here's a ten-slide structure, what each slide must prove, and the mistakes that lose investors on slide two.",
    author: "PreSeedHealer Team",
    tags: ["pitch deck", "pre-seed", "fundraising"],
    content: `Most investors spend **less than three minutes** on a first-pass pitch deck. At pre-seed, they aren't looking for perfect numbers; they're looking for a sharp problem, a credible team and early evidence that customers care.

## The 10-slide structure

| # | Slide | What it must prove |
|---|---|---|
| 1 | Title + one-liner | Investors understand what you do in one sentence |
| 2 | Problem | The pain is real, frequent and costly |
| 3 | Solution | Your product removes that pain better than today's alternatives |
| 4 | Traction | Someone other than you cares: users, pilots, revenue, waitlist |
| 5 | Market | The opportunity can support a venture-scale company |
| 6 | Business model | How you make money and roughly what a customer is worth |
| 7 | Competition | You know the landscape and have a reason to win |
| 8 | Team | Why *this* team will out-execute everyone else |
| 9 | Go-to-market | How you'll acquire the next 1,000 customers |
| 10 | The ask | How much you're raising and the milestones it unlocks |

## What investors look for at pre-seed

### Founder–market fit
Explain why you are uniquely placed to solve this problem: lived experience, domain expertise or unfair access to customers.

### Evidence over projections
Five paying pilots beat a five-year revenue projection. If you have no revenue, show engagement, retention or letters of intent.

### A clear use of funds
"18 months of runway to reach ₹10L MRR and 3 enterprise pilots" is far stronger than "for growth and hiring".

## Common mistakes

- Opening with market size instead of the problem
- Ten bullet points per slide (one idea per slide is enough)
- Hiding the ask until the Q&A
- Vanity metrics such as downloads without retention
- No contact details on the final slide

## Before you hit send

1. Export to PDF and keep it under 10 MB.
2. Share a view-only link (Google Drive or DocSend) so you can see who opened it.
3. Name the file \`StartupName_PreSeed_2026.pdf\`, not \`deck-final-v7.pdf\`.

Ready to put your deck in front of investors? [Apply to PreSeedHealer](/apply).`,
    faqs: [
      { question: "How long should a pre-seed pitch deck be?", answer: "10–12 slides is ideal. Put extra detail in an appendix rather than the main flow." },
      { question: "Do I need financial projections at pre-seed?", answer: "A simple 18–24 month plan tied to your use of funds is enough. Detailed five-year models add little at this stage." },
    ],
  },
  {
    title: "Startup India Recognition (DPIIT): Eligibility, Benefits and How to Apply",
    slug: "dpiit-startup-recognition-guide",
    category: "government-schemes",
    excerpt:
      "DPIIT recognition unlocks tax benefits, easier compliance and access to government schemes. Here's who qualifies and how to apply in under an hour.",
    author: "PreSeedHealer Team",
    tags: ["DPIIT", "Startup India", "government schemes"],
    content: `DPIIT recognition is the gateway to most Startup India benefits. The application is free and fully online.

## Who is eligible?

- A Private Limited Company, Registered Partnership Firm or LLP
- Incorporated **less than 10 years** ago
- Annual turnover has not exceeded **₹100 crore** in any financial year
- Working towards innovation or improvement of products, processes or services, or a scalable business model with high potential for employment or wealth creation
- Not formed by splitting up or reconstructing an existing business

## Key benefits

| Benefit | What it means |
|---|---|
| Tax holiday (Section 80-IAC) | Eligible startups can claim a 3-year income tax exemption within their first 10 years (requires a separate IMB certificate) |
| Self-certification | Self-certify compliance under specified labour and environmental laws |
| Faster IP filing | Fast-tracked patent examination and fee rebates |
| Public procurement | Relaxed prior-experience and turnover norms in government tenders |
| Scheme access | A prerequisite for many central and state schemes and funds |

## How to apply

1. Register on the Startup India portal.
2. Complete the recognition form with entity, address and director details.
3. Upload your certificate of incorporation.
4. Describe the innovation, its scalability and the problem it solves.
5. Submit and track status on the portal dashboard.

> Always confirm current criteria and benefits on the official Startup India portal. Rules change, and this article is general information, not legal or tax advice.

Recognised startups can mention it in their [PreSeedHealer application](/apply). It helps our team understand your stage.`,
    faqs: [
      { question: "Is DPIIT recognition mandatory to apply to PreSeedHealer?", answer: "No. It's helpful context, but startups without recognition are welcome to apply." },
      { question: "How much does DPIIT recognition cost?", answer: "Nothing. The application on the Startup India portal is free." },
    ],
  },
  {
    title: "What Happens After You Apply to PreSeedHealer?",
    slug: "what-happens-after-you-apply",
    category: "programme-updates",
    excerpt:
      "From reference number to investor conversations: a step-by-step look at how PreSeedHealer reviews applications and what shortlisted founders can expect.",
    author: "PreSeedHealer Team",
    tags: ["application", "selection process"],
    content: `Submitting an application is the start of a structured review. Here's what happens next.

## 1. Confirmation

You'll receive an email with a **reference number** (for example \`PSH-26-7K3QXM\`). Keep it handy for any follow-up.

## 2. Screening

Our team reviews every application against four lenses:

- **Problem and market:** is the problem real and large enough?
- **Team:** does the team have the skills and commitment to execute?
- **Traction:** what evidence shows customers want this?
- **Investor readiness:** is the deck clear and the ask realistic?

## 3. Shortlisting

Shortlisted founders are contacted by email for a short conversation and may be asked for updated material.

## 4. Investor exposure

Selected startups are presented to relevant investors and partners in our network, and may progress to Phase 02 programming.

## Tips while you wait

- Keep your deck link live and up to date.
- Reply promptly if we reach out. Response time is a signal too.
- Follow [Insights](/insights) for programme updates.

Questions? Visit the [FAQ](/faq) or [contact us](/contact).`,
    faqs: [],
  },
];

/** SAMPLE directory entries: replace with real, consented partner data before launch. */
export const partners: PartnerInput[] = [
  { name: "Sample Angel Network", role: "Angel Investor Partner", type: "angel", description: "Placeholder profile. Replace with a real angel network or individual investor from the admin panel.", order: 1 },
  { name: "Sample Seed Fund", role: "Venture Capital Partner", type: "vc", description: "Placeholder profile for an early-stage venture fund investing in pre-seed and seed rounds.", order: 2 },
  { name: "Sample Family Office", role: "Family Office Partner", type: "family-office", description: "Placeholder profile for a family office with a dedicated startup allocation.", order: 3 },
  { name: "Sample Corporate Ventures", role: "Corporate Investor Partner", type: "corporate", description: "Placeholder profile for a corporate investor seeking strategic startup partnerships.", order: 4 },
  { name: "Sample Incubation Centre", role: "Incubation Partner", type: "incubator", description: "Placeholder profile for an incubator offering mentoring, workspace and programme support.", order: 5 },
  { name: "Sample University Foundation", role: "Institutional Partner", type: "institutional", description: "Placeholder profile for an academic or institutional ecosystem partner.", order: 6 },
  { name: "Sample Domain Mentor", role: "Mentor & Domain Expert", type: "mentor", description: "Placeholder profile for a mentor who helps founders with go-to-market and fundraising.", order: 7, showOnInvestors: false },
  { name: "Sample Community Partner", role: "Channel Partner", type: "channel", description: "Placeholder profile for a startup community that helps founders discover the programme.", order: 8, showOnInvestors: false },
];

export const faqs: FaqInput[] = [
  { group: "Applying", order: 1, question: "Who can apply to PreSeedHealer?", answer: "Early-stage Indian startups (from idea to early revenue) that are actively preparing to raise capital. We look at the problem, team, traction and investor readiness." },
  { group: "Applying", order: 2, question: "How do I apply?", answer: "Fill in the online application on the Apply page. It takes about 10 minutes. Keep your pitch deck link ready (Google Drive, DocSend or similar)." },
  { group: "Applying", order: 3, question: "Is there an application fee?", answer: "Phase 01 applications are free. Any fees for later programmes will be clearly communicated in advance." },
  { group: "Applying", order: 4, question: "Do I need DPIIT recognition or an incorporated company?", answer: "No. Both help, but they aren't mandatory to apply." },
  { group: "Selection", order: 1, question: "How are startups selected?", answer: "Our team reviews each application for problem and market, team, traction and investor readiness. Shortlisted founders are contacted by email." },
  { group: "Selection", order: 2, question: "When will I hear back?", answer: "You'll get a confirmation email with a reference number immediately. Shortlisted founders are contacted as reviews progress; follow Insights for programme updates." },
  { group: "Selection", order: 3, question: "Does selection guarantee funding?", answer: "No. PreSeedHealer creates visibility and investor conversations. Investment decisions are made independently by investors." },
  { group: "Investors & partners", order: 1, question: "How can I join as an investor?", answer: "Use the Join as investor form on the Investors page. Our team will reach out to understand your thesis and ticket size." },
  { group: "Investors & partners", order: 2, question: "How do I become an ecosystem partner?", answer: "Send us a note through the Contact page and choose “Partnership” as the subject." },
  { group: "General", order: 1, question: "Where can I find official updates?", answer: "All official announcements are published on the Insights page and in the announcement bar at the top of this website." },
];

const legalNote = "\n\n---\n\n*This is a starter template. Have it reviewed by a qualified legal professional before launch and edit it from the admin panel.*";

export const pages = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    content: `This Privacy Policy explains how PreSeedHealer ("we", "us") collects, uses and protects personal information when you use preseedhealer.com.

## Information we collect

- **Information you provide:** name, email, phone, city, startup details, pitch deck links and messages submitted through our forms.
- **Technical data:** IP address, browser type and pages visited, collected through server logs and, with your consent, analytics cookies.

## How we use it

- To review applications and investor-interest submissions
- To contact you about your application, programme updates and events
- To share information about selected startups with relevant investors and partners, where you have applied for that purpose
- To secure and improve our website

## Sharing

We do not sell personal data. We share information only with investors and partners as part of the programme, with service providers who help us operate (hosting, email), or when required by law.

## Retention

We keep submissions for as long as needed for the programme and legitimate record-keeping, after which they are deleted or anonymised.

## Your rights

Under the Digital Personal Data Protection Act, 2023 you may request access, correction or erasure of your personal data, and withdraw consent. Contact us using the details on our [Contact & Grievance](/legal/contact-grievance) page.${legalNote}`,
  },
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    content: `By accessing preseedhealer.com you agree to these terms.

## Use of the website

You agree to use the website lawfully and not to submit false, misleading or infringing information.

## Applications

Submitting an application does not guarantee selection, investor meetings or funding. Selection decisions are at our sole discretion.

## Third-party links

Partner and investor profiles may link to external websites. We are not responsible for their content or practices.

## Liability

The website and its content are provided "as is". To the extent permitted by law, we are not liable for any indirect or consequential loss arising from its use.

## Governing law

These terms are governed by the laws of India.${legalNote}`,
  },
  {
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    content: `Phase 01 applications are free of charge.

Where a paid programme, ticket or service is offered in future, its specific refund and cancellation terms will be shown before payment. Unless stated otherwise, refund requests must be made in writing before the programme start date.${legalNote}`,
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    content: `Content on this website, including Insights articles, is for general information only and does not constitute financial, legal, tax or investment advice.

PreSeedHealer does not solicit investment, offer securities, or guarantee returns. Investors must conduct their own due diligence, and founders should seek professional advice before entering into any agreement.

Partner listings do not imply endorsement of any investment decision.${legalNote}`,
  },
  {
    slug: "application-selection",
    title: "Application & Selection Disclaimer",
    content: `- Applications are reviewed at the sole discretion of the PreSeedHealer team.
- Submitting an application does not guarantee shortlisting, presentation to investors, or funding.
- We may request additional information or verify details shared in your application.
- False or misleading information may lead to disqualification at any stage.
- Investors make independent decisions; PreSeedHealer is not a party to any investment.${legalNote}`,
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    content: `We use a small number of cookies.

| Cookie | Purpose | Type |
|---|---|---|
| \`psh_consent\` | Remembers your cookie choice | Essential |
| \`psh_session\` | Keeps administrators signed in | Essential (admin only) |
| \`_ga\`, \`_ga_*\` | Google Analytics usage statistics | Analytics (only with consent) |

You can change your choice at any time by clearing cookies for this site, which will show the consent banner again.${legalNote}`,
  },
  {
    slug: "intellectual-property",
    title: "Intellectual Property",
    content: `The PreSeedHealer name, logo, website design and original content are our intellectual property and may not be used without written permission.

Founders retain full ownership of the material they submit (pitch decks, descriptions and logos). By applying, you grant us a limited licence to review that material and share it with relevant investors and partners for the purposes of the programme.

Partner names and logos belong to their respective owners.${legalNote}`,
  },
  {
    slug: "contact-grievance",
    title: "Contact & Grievance",
    content: `For questions, data requests or grievances, please use our [contact form](/contact) and choose the most relevant subject.

## Grievance Officer

In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023:

- **Name:** [Grievance Officer name]
- **Email:** [grievance email]
- **Address:** [registered address]

We aim to acknowledge grievances within 48 hours and resolve them within 30 days.${legalNote}`,
  },
];
