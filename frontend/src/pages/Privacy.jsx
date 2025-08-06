import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back navigation */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center">
          <Link 
            to="/" 
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chart
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
      </div>

      {/* Privacy Policy Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Privacy Policy for Ownero.app</h2>
            <p className="text-sm text-gray-500 mb-4"><strong>Effective Date:</strong> August 6, 2025</p>
            <p className="text-gray-700 leading-relaxed">
              Ownero.app is a tool designed to help users <strong>create and visualize company ownership structures</strong>. Your privacy is important, and this policy outlines how data is handled on the site.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1. No Accounts, No Storage</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Ownero.app is a <strong>pure frontend application</strong>. It does <strong>not require an account</strong>, and <strong>no data is stored on a server</strong>. All work you do in the app is saved <strong>locally in your browser's memory only</strong> – once you reload or close the tab, your data is gone.
              </p>
              <p className="text-blue-600 font-medium">
                👉 <em>For this reason, it's important to download your file before leaving the page!</em>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Analytics</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                This site uses <strong><a href="https://vercel.com/docs/analytics/quickstart" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Vercel Web Analytics</a></strong>, which is <strong>privacy-friendly and cookie-free</strong>. It collects only <strong>aggregated, anonymized metrics</strong> such as:
              </p>
              <ul className="list-disc ml-6 text-gray-700 mb-3 space-y-1">
                <li>Page views</li>
                <li>Country (based on IP)</li>
                <li>Device and browser type</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                No personally identifiable information is stored or tracked.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Feedback Form</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                If you choose to submit feedback using the form, your message is sent <strong>directly via email to the developer</strong>.
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>The message is <strong>not stored anywhere else</strong>.</li>
                <li>Once the feedback is read and (optionally) added to the product roadmap, the email is deleted.</li>
                <li>No user data is retained.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Data Deletion</h3>
              <p className="text-gray-700 leading-relaxed">
                Because no user data is stored by the app, <strong>no deletion request is necessary</strong>. You can clear your in-browser session simply by refreshing the page or closing the tab.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Contact</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about privacy, you may use the <strong>Feedback</strong> button in the top navigation to get in touch.
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Attribution</h3>
              <p className="text-gray-700 leading-relaxed">
                Chart icon used in the application is provided by <a href="https://www.flaticon.com/free-icons/chart" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Freepik - Flaticon</a> under free license.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;