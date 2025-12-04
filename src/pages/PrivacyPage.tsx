// src/pages/PrivacyPage.tsx
const PrivacyPage = () => {
  return (
    <main className="bg-brand-dark text-white min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-display font-semibold">Privacy Policy</h1>
        <p className="text-sm text-white/60 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed text-white/80">

          <p>
            Road America Auto Transport (“we”, “us”, “our”) is committed to
            protecting your personal information and your right to privacy. This
            Privacy Policy explains what information we collect, how we use it,
            how we protect it, and your rights regarding your data.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">1. Information We Collect</h2>
          <p>We collect information directly from you when you:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Request a transport quote</li>
            <li>Create a client account or log into the client portal</li>
            <li>Track a shipment using your reference ID and email</li>
            <li>Contact us by phone, email, or through our website</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mt-4">Personal Information</h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Pickup and delivery locations</li>
            <li>Vehicle details (year, make, model, VIN)</li>
            <li>Account login credentials (stored securely by our authentication provider)</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mt-4">Automatically Collected Data</h3>
          <p>When you visit our website, we may collect:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>IP address</li>
            <li>Browser type and settings</li>
            <li>Device information</li>
            <li>Pages viewed and interactions with the site</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Provide accurate transport quotes</li>
            <li>Assign drivers and schedule vehicle pickup and delivery</li>
            <li>Maintain your client account and secure login</li>
            <li>Send shipment updates and confirmations</li>
            <li>Allow you to track your transport status</li>
            <li>Respond to inquiries and provide customer support</li>
            <li>Improve website performance and user experience</li>
            <li>Comply with legal, regulatory, and safety requirements</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">3. How We Store & Protect Your Information</h2>
          <p>Your data is securely stored using Supabase, a hosted database and authentication platform. Supabase uses industry-standard encryption, access controls, and network security protocols.</p>
          <p className="mt-2">We implement the following protections:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Encrypted database connections</li>
            <li>Role-based access controls for admin and employee accounts</li>
            <li>Secure password storage and authentication</li>
            <li>Limited access to client data by authorized staff only</li>
            <li>Regular monitoring and security reviews</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">4. Sharing Your Information</h2>
          <p>We only share your information when necessary to complete your transport or as required by law.</p>

          <p className="mt-2">We may share limited information with:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Licensed and insured carriers to complete your shipment</li>
            <li>Service providers (e.g., email delivery partners)</li>
            <li>Government authorities, if required for legal compliance</li>
          </ul>

          <p className="mt-2 font-semibold text-white">
            We do <span className="text-brand-red">not</span> sell or rent your
            personal information to third parties.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">5. Cookies & Tracking Technologies</h2>
          <p>
            Our website may use cookies or similar technologies to enhance your
            browsing experience, improve site performance, and help diagnose
            issues. You may disable cookies in your browser settings, although
            some features may not function correctly.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">6. Your Data Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request corrections to inaccurate information</li>
            <li>Request deletion of your account or data (where legally permitted)</li>
            <li>Opt out of marketing emails</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">7. Data Retention</h2>
          <p>
            We retain transport and account data as long as necessary to provide
            service, comply with legal requirements, resolve disputes, and
            maintain records of past shipments.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">8. Children’s Privacy</h2>
          <p>
            Our services are not intended for children under 16, and we do not
            knowingly collect personal data from minors.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with a new “Last Updated” date.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or your data, please
            contact us at:
          </p>
          <p className="mt-2 text-white">
            <strong>Email:</strong> support@roadamericaautotransport.com
          </p>
          <p className="text-white">
            <strong>Phone:</strong> (555) 555-5555
          </p>

        </section>
      </div>
    </main>
  );
};

export default PrivacyPage;
