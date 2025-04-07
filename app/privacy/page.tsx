import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Stupid Mails",
  description: "Privacy policy and data handling practices for Stupid Mails",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className=" rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                We are committed to protecting your privacy and handling your
                data with transparency. This policy explains how we collect,
                use, and protect your information when you use Stupid Mails
                (&quot;the Service&quot;).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-medium mb-2">
                2.1 Account Information
              </h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Email address</li>
                <li>Name (optional)</li>
                <li>Profile picture (optional)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">
                2.2 Gmail Integration Data
              </h3>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  Email metadata (subject lines, sender information, timestamps)
                </li>
                <li>Email content (for classification purposes only)</li>
                <li>Labels and categories</li>
              </ul>

              <p className="mb-4">
                <strong>Important:</strong> We only request read-only access to
                your Gmail account. We cannot modify, send, or delete your
                emails.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  To provide email classification and organization services
                </li>
                <li>
                  To analyze email patterns and improve our classification
                  algorithms
                </li>
                <li>To maintain and optimize the service</li>
                <li>
                  To communicate with you about your account and service updates
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                4. Data Protection
              </h2>
              <ul className="list-disc pl-6 mb-4">
                <li>All data is encrypted at rest and in transit</li>
                <li>We use secure OAuth 2.0 for Gmail authentication</li>
                <li>Regular security audits and monitoring</li>
                <li>Limited employee access to user data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
              <p className="mb-4">
                We retain your data only as long as necessary to provide the
                service. You can request deletion of your account and associated
                data at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                6. Third-Party Services
              </h2>
              <p className="mb-4">We use the following third-party services:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Google Gmail API for email access</li>
                <li>OpenAI API for email classification</li>
                <li>Better Auth for authentication</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access your personal data</li>
                <li>Request correction of your data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for data processing</li>
                <li>Request data portability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this privacy policy or our data
                practices, please contact us at{" "}
                <a
                  href="mailto:privacy@stupidmails.com"
                  className="text-blue-600 hover:text-blue-800"
                >
                  nainishrai999@gmail.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                9. Updates to This Policy
              </h2>
              <p className="mb-4">
                We may update this privacy policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the effective date.
              </p>
            </section>

            <div className="mt-8 text-sm text-gray-600">
              Last updated: April 8, 2025
            </div>
          </div>

          <div className="mt-8 pt-8 border-t">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
