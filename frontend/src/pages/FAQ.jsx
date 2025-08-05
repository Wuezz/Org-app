import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const FAQ = () => {
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
          <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 mb-8">
            Ownero.app is a lightweight tool for visualizing ownership and control. Below you'll find answers to common questions about privacy, saving your work, and the story behind the project.
          </p>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Is my data private and safe?</h3>
              <p className="text-gray-700 leading-relaxed">
                Yes. Nothing you create in Ownero.app is sent to a server or stored online. Everything runs locally in your browser unless you choose to export it manually. Every time you reload or close the page, everything is deleted. <br /><br />
                So make sure to download an image or PDF before exiting! <br /><br />
                (Yes, this may seem impractical – but it’s actually a safeguard to make sure your data stays with you, and that we don’t store any sensitive information on our servers.)
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I save my chart?</h3>
              <p className="text-gray-700 leading-relaxed">
                Yes! You can export your chart as an image or a PDF. In the future, we may add support for saving/loading local files or optional cloud storage.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Is there autosave or version history?</h3>
              <p className="text-gray-700 leading-relaxed">
                Not yet. For now, you’ll need to export manually to save your work.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Who built Ownero.app?</h3>
              <p className="text-gray-700 leading-relaxed">
                Ownero.app is an indie project built by a solo developer based in Sweden – someone who got tired of making ownership charts for KYC requests in PowerPoint, Excel, Canva, or other tools that never quite hit the mark. <br /><br />
                It was launched in the summer of 2025, built out of both frustration and passion.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Is it free to use?</h3>
              <p className="text-gray-700 leading-relaxed">
                Yes – 100% free, for now. This may change in the future.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I use it for business presentations?</h3>
              <p className="text-gray-700 leading-relaxed">
                Absolutely. Everything you create in Ownero.app can be used in decks, reports, pitch materials, internal documentation, or for KYC/AML purposes – no licenses required.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How does export work?</h3>
              <p className="text-gray-700 leading-relaxed">
                When you export your chart, what you see is what you get – clean, high-quality output as an image or a PDF. <br /><br />
                The image export currently looks better than the PDF version, so I recommend using that for now. Improvements to PDF export are on the roadmap.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Is my chart shared with anyone?</h3>
              <p className="text-gray-700 leading-relaxed">
                No. Your chart stays entirely on your device unless you choose to download and share it yourself. There is no backend or database connection involved.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Are more features coming?</h3>
              <p className="text-gray-700 leading-relaxed">
                Yes! Features like indirect ownership links, export themes, mobile layout improvements, and team sharing are all planned.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What makes Ownero.app unique?</h3>
              <p className="text-gray-700 leading-relaxed">
                Ownero.app is fast, focused, and clutter-free. It lets you build clear ownership structures with style – without logins, paywalls, or unnecessary complexity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;