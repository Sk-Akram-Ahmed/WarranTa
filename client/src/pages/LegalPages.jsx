import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const LAST_UPDATED = 'October 14, 2026';
const CONTACT_EMAIL = '[your-email@example.com]';

const LegalPage = ({ title, intro, sections }) => (
  <article className="container legal-page">
    <header className="legal-header">
      <p className="legal-eyebrow">Warranty Tracker</p>
      <h1>{title}</h1>
      <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
      <p className="legal-intro">{intro}</p>
    </header>

    <Card as="nav" className="legal-toc" aria-label={`${title} table of contents`}>
      <h2>Table of contents</h2>
      <ol>
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`}>{section.title}</a>
          </li>
        ))}
      </ol>
    </Card>

    <div className="legal-sections">
      {sections.map((section) => (
        <section className="legal-section" id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          {section.content}
        </section>
      ))}
    </div>
  </article>
);

export const PrivacyPolicy = () => (
  <LegalPage
    title="Privacy Policy"
    intro="This policy explains what information Warranty Tracker handles, why it is used, and the choices available to you."
    sections={[
      {
        id: 'information-we-collect',
        title: '1. Information we collect',
        content: (
          <>
            <p>When you create an account, we collect your name, email address, and a password stored as a one-way hash. We do not store your account password in readable form.</p>
            <p>Warranty records you choose to enter may include product names, brands, models, serial numbers, purchase dates, warranty periods and expiry dates, shop names, prices, and notes. If you upload bills or receipts, we store the uploaded file and basic file details such as its name, type, size, and Cloudinary metadata.</p>
            <p>The service also processes information needed to operate and protect the site, such as authentication tokens and basic server request or error logs.</p>
          </>
        ),
      },
      {
        id: 'how-we-use-information',
        title: '2. How we use information',
        content: (
          <p>We use account information to create and manage your account, authenticate you, and respond to your requests. Warranty information and files are used to show your records, calculate dates, and support reminder features. We use operational logs to maintain, troubleshoot, and protect the service. We do not sell your personal information.</p>
        ),
      },
      {
        id: 'storage-and-security',
        title: '3. Storage and security',
        content: (
          <p>Account and warranty data are stored in a MongoDB database configured by the service operator. Uploaded bills are stored in Cloudinary, a third-party media processor and storage service used to securely host and deliver files. Passwords are hashed, and account-only routes and files require authentication. We use reasonable safeguards, but no online service or storage method can be guaranteed completely secure. Do not upload information you are not authorized to share.</p>
        ),
      },
      {
        id: 'third-party-services',
        title: '4. Third-party services',
        content: (
          <p>The service may use an email provider configured by the operator to deliver warranty reminders or service messages. That provider receives the information needed to send the email, such as your email address and message content, and handles it under its own privacy terms. The service also uses Cloudinary as a third-party content delivery and processing provider for uploaded receipts and warranty files, including signed URLs for authenticated access. The provider may be [email provider] or Cloudinary. Contact the operator for the provider currently in use.</p>
        ),
      },
      {
        id: 'retention-and-deletion',
        title: '5. Retention and deletion',
        content: (
          <p>We retain your account data, warranty records, and uploaded files while your account is active and as needed to provide the service. You can request access to or correction of your information by contacting us. You can delete your account from Account Settings; deletion removes your account, warranty records, and associated uploaded files from the active application storage. Limited copies may remain temporarily in system backups or logs until those are rotated or deleted.</p>
        ),
      },
      {
        id: 'your-rights',
        title: '6. Your rights and choices',
        content: (
          <p>You may request access to your personal information, ask us to correct inaccurate information, or request deletion. Depending on where you live, you may have additional privacy rights. You can also update warranty information yourself in the application. To exercise a right or ask a question, email <a href="mailto:your-email@example.com">{CONTACT_EMAIL}</a>.</p>
        ),
      },
      {
        id: 'cookies-and-local-storage',
        title: '7. Cookies and local storage',
        content: (
          <p>The application uses browser localStorage to keep your authentication token and signed-in user information so you can remain logged in between page visits. The app does not rely on advertising cookies. You can clear localStorage in your browser, which will sign you out; this does not itself delete your account or server-side data.</p>
        ),
      },
      {
        id: 'contact',
        title: '8. Contact',
        content: (
          <p>For privacy requests or questions, contact [Your Name] at <a href="mailto:your-email@example.com">{CONTACT_EMAIL}</a>.</p>
        ),
      },
    ]}
  />
);

export const TermsAndConditions = () => (
  <LegalPage
    title="Terms and Conditions"
    intro="By creating an account or using Warranty Tracker, you agree to these terms. If you do not agree, do not use the service."
    sections={[
      {
        id: 'using-the-service',
        title: '1. Using the service',
        content: (
          <p>Warranty Tracker helps you organize product warranty information, uploaded bills, and relevant dates. You must provide accurate account details, keep your password confidential, and use the service lawfully. You are responsible for activity conducted through your account.</p>
        ),
      },
      {
        id: 'your-information-and-files',
        title: '2. Your information and files',
        content: (
          <p>You retain responsibility for the names, email address, warranty details, notes, and bill files you submit. You confirm that you have the right to store and use those files and that they do not violate another person's rights or applicable law. Keep your own copies of important bills and warranty documents.</p>
        ),
      },
      {
        id: 'privacy-and-security',
        title: '3. Privacy and security',
        content: (
          <p>Our <Link to="/privacy">Privacy Policy</Link> explains how account details, warranty records, and uploaded files are handled, including storage, email delivery, retention, and account deletion. We use reasonable safeguards but cannot promise that the service will always be available or completely secure.</p>
        ),
      },
      {
        id: 'tracking-aid-and-disclaimer',
        title: '4. Tracking aid and disclaimer',
        content: (
          <p>Warranty Tracker is provided as an organizational and tracking aid only. Dates, calculations, and reminders may be incomplete, delayed, or incorrect. The service is not a substitute for checking your original purchase documents or confirming coverage with the manufacturer or seller. You are responsible for verifying your information and expiry dates. To the fullest extent permitted by law, [Your Name] and the service are not liable for missed expiry dates, missed reminders, incorrect user-entered data, or decisions made in reliance on the service.</p>
        ),
      },
      {
        id: 'account-deletion',
        title: '5. Account deletion',
        content: (
          <p>You may delete your account through Account Settings after confirming your password. This permanently deletes the account, its warranty records, and associated uploaded bill files from active application storage. You are responsible for downloading any records you wish to keep before deletion.</p>
        ),
      },
      {
        id: 'availability-and-changes',
        title: '6. Availability and changes',
        content: (
          <p>The service is provided on an as-available basis. Features may change, be interrupted, or be discontinued. We may update these terms; the updated date above indicates when they were last revised. Continued use after an update means you accept the revised terms.</p>
        ),
      },
      {
        id: 'governing-law-and-contact',
        title: '7. Governing law and contact',
        content: (
          <p>These terms are governed by the laws of [Your jurisdiction], without regard to conflict-of-law rules. For questions about these terms, contact [Your Name] at <a href="mailto:your-email@example.com">{CONTACT_EMAIL}</a>.</p>
        ),
      },
    ]}
  />
);

export const Contact = () => (
  <LegalPage
    title="Contact"
    intro="Reach out for help with your account, privacy requests, or questions about Warranty Tracker."
    sections={[
      {
        id: 'email',
        title: '1. Email',
        content: (
          <p>Contact [Your Name] at <a href="mailto:your-email@example.com">{CONTACT_EMAIL}</a>. Please do not email passwords or sensitive payment information.</p>
        ),
      },
      {
        id: 'privacy-requests',
        title: '2. Privacy requests',
        content: (
          <p>To request access to, correction of, or deletion of your personal data, email us from the address associated with your account and describe your request. You can also delete your account from Account Settings.</p>
        ),
      },
      {
        id: 'helpful-details',
        title: '3. Helpful details',
        content: (
          <p>For a technical issue, include a short description and the steps that led to it. Do not send your password, authentication token, or unredacted bill files unless they are necessary and you are comfortable sharing them.</p>
        ),
      },
    ]}
  />
);
