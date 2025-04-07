import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Stupid Mails",
  description: "Terms and conditions for using the Stupid Mails service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className=" rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="mb-4">
                By accessing or using Stupid Mails (&quot;the Service&quot;),
                you agree to be bound by these Terms of Service. If you do not
                agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                2. Service Description
              </h2>
              <p className="mb-4">
                Stupid Mails is an AI-powered email management tool that helps
                users organize and prioritize their emails through:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Email classification using artificial intelligence</li>
                <li>Read-only Gmail integration</li>
                <li>Custom email categorization and organization</li>
                <li>Email anxiety management features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                3. Account Registration
              </h2>
              <p className="mb-4">To use the Service, you must:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Have a valid Gmail account</li>
                <li>Create an account with accurate information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us of any unauthorized account access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                4. Gmail Integration
              </h2>
              <p className="mb-4">By using the Service, you authorize us to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access your Gmail account through OAuth 2.0</li>
                <li>Read and analyze your email content and metadata</li>
                <li>Store necessary data for classification purposes</li>
              </ul>
              <p className="mb-4">
                We maintain read-only access and cannot modify, send, or delete
                your emails.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                5. User Responsibilities
              </h2>
              <p className="mb-4">You agree to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Use the Service in compliance with all applicable laws</li>
                <li>
                  Not attempt to bypass any service limitations or restrictions
                </li>
                <li>Not use the Service to harm others or spread malware</li>
                <li>Not interfere with the proper operation of the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                6. AI Classification
              </h2>
              <p className="mb-4">You acknowledge that:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  AI classification is not perfect and may occasionally
                  misclassify emails
                </li>
                <li>
                  The Service uses Open-Source models like Llama and Deepseek
                  for classification
                </li>
                <li>
                  You should review important emails regardless of their
                  classification
                </li>
                <li>
                  Classification preferences can be customized but may require
                  training time
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                7. Privacy and Data Security
              </h2>
              <p className="mb-4">
                We are committed to protecting your privacy and data security as
                outlined in our{" "}
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Privacy Policy
                </Link>
                . By using the Service, you agree to our data handling
                practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                8. Service Availability
              </h2>
              <p className="mb-4">
                While we strive for high availability, we do not guarantee that:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>The Service will be available at all times</li>
                <li>The Service will be error-free</li>
                <li>Any errors will be corrected in a timely manner</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                9. Modifications to Service
              </h2>
              <p className="mb-4">We reserve the right to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Modify or discontinue any part of the Service</li>
                <li>Change service fees with reasonable notice</li>
                <li>Update these terms as needed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                10. Limitation of Liability
              </h2>
              <p className="mb-4">
                To the maximum extent permitted by law, we shall not be liable
                for:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Any indirect, incidental, or consequential damages</li>
                <li>Loss of data or business interruption</li>
                <li>Damages resulting from misclassified emails</li>
                <li>Issues arising from third-party service integrations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your access to the Service:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>For violations of these terms</li>
                <li>At our sole discretion with reasonable notice</li>
                <li>If required by law or third-party service providers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                12. Contact Information
              </h2>
              <p className="mb-4">
                For questions about these terms, please contact us at{" "}
                <a
                  href="mailto:nainishrai999@gmail.com"
                  className="text-blue-600 hover:text-blue-800"
                >
                  nainishrai999@gmail.com
                </a>
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
