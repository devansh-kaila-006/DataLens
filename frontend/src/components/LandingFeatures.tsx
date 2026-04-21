/**
 * v2 Features Section - Light theme, clean design
 * Professional feature showcase with flat colors
 */

import { Link } from 'react-router-dom'

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Automated EDA Reports',
    description: 'Comprehensive exploratory data analysis with statistical summaries, distributions, and correlations generated automatically.',
    color: 'teal',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'AI-Powered Insights',
    description: 'Machine learning algorithms analyze your data and provide actionable insights and recommendations you might miss.',
    color: 'warning',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Interactive Visualizations',
    description: 'Beautiful, interactive charts and graphs that let you explore your data from multiple angles with drill-down capabilities.',
    color: 'info',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, secure data storage, and compliance with GDPR and SOC 2 standards for your peace of mind.',
    color: 'error',
  },
]

export default function LandingFeatures() {
  return (
    <section className="py-24 bg-white">
      <div className="container-premium">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything you need for
            <span className="text-teal-600"> intelligent data analysis</span>
          </h2>
          <p className="text-xl text-gray-600">
            From upload to insights in minutes. Our platform handles the complexity so you can focus on decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card p-8 hover:shadow-md transition-shadow duration-150 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-16 h-16 rounded-md bg-${feature.color}-50 flex items-center justify-center mb-6 text-${feature.color}-600`}
              >
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="card p-12 shadow-md">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to transform your data?</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Start analyzing your data right away—no sign-up required. Or create an account to save your work and access premium features.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/upload" className="btn btn-primary text-lg">
                Try Demo Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/signup" className="btn btn-secondary text-lg">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
