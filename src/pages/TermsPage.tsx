// src/pages/TermsPage.tsx
const TermsPage = () => {
  return (
    <main className="bg-brand-dark text-white min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-display font-semibold">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-white/60 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed text-white/80">
          <p>
            These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of
            the Road America Auto Transport website, client portal, and any
            services we provide (&quot;Services&quot;). By requesting a quote,
            booking a shipment, creating an account, or using our website, you
            agree to these Terms.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            1. Our Role
          </h2>
          <p>
            Road America Auto Transport operates as a transport broker and
            coordinator. We arrange vehicle transport with licensed and insured
            motor carriers (&quot;Carriers&quot;), but we do not physically
            transport vehicles ourselves.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            2. Quotes &amp; Pricing
          </h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              Quotes are based on the information you provide, including
              locations, vehicle details, and timing.
            </li>
            <li>
              Pricing may change if details change (e.g., different vehicle
              condition, access issues, date changes).
            </li>
            <li>
              Any additional fees (e.g., storage, re-delivery, access issues)
              will be communicated whenever possible.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">
            3. Booking &amp; Scheduling
          </h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              Pickup and delivery dates are estimates and depend on Carrier
              availability, routing, traffic, and weather.
            </li>
            <li>
              We will provide a reference ID and status updates once your
              shipment is confirmed.
            </li>
            <li>
              You are responsible for providing accurate pickup and delivery
              contact information.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">
            4. Vehicle Condition &amp; Preparation
          </h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              You must disclose if the vehicle is non-running or has special
              loading requirements.
            </li>
            <li>
              The vehicle should be free of loose items and personal belongings,
              unless otherwise agreed in writing.
            </li>
            <li>
              Carriers may refuse transport or charge additional fees for
              undisclosed conditions.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">
            5. Damage, Insurance &amp; Claims
          </h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              Carriers are required to maintain appropriate cargo insurance
              coverage for transported vehicles.
            </li>
            <li>
              You (or your designated representative) are responsible for
              inspecting the vehicle at pickup and delivery and noting any
              damage on the bill of lading.
            </li>
            <li>
              Any damage claims must be filed directly with the Carrier in
              accordance with their policies and timelines.
            </li>
            <li>
              Road America Auto Transport will assist with information and
              documentation but is not the insurer and is not responsible for
              Carrier negligence.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">
            6. Cancellations &amp; Changes
          </h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              If you need to cancel or change your shipment, please contact us
              as soon as possible.
            </li>
            <li>
              Cancellation fees or rescheduling fees may apply once a Carrier
              has been assigned or dispatched.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">
            7. Client Portal &amp; Account Use
          </h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              If you are provided with a client login, you are responsible for
              keeping your password secure and up to date.
            </li>
            <li>
              You agree not to share your login with unauthorized users or
              attempt to access other clients&apos; shipments.
            </li>
            <li>
              We may suspend or disable accounts that violate these Terms or
              are used improperly.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">
            8. Acceptable Use of the Website
          </h2>
          <p>
            You agree not to use our website or Services to engage in unlawful,
            harmful, or abusive activities, including attempting to interfere
            with security, submit fraudulent information, or scrape data without
            permission.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            9. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, Road America Auto Transport
            is not liable for:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Delays caused by Carriers, weather, or events beyond our control</li>
            <li>Damage, loss, or theft of vehicles while in Carrier custody</li>
            <li>Indirect, incidental, or consequential damages</li>
          </ul>
          <p className="mt-2">
            Our total liability related to any shipment or use of our Services
            is limited to the amount of brokerage fees paid to us for that
            shipment.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            10. Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time. The updated version
            will be posted on this page with a new &quot;Last Updated&quot;
            date. Continued use of our Services after changes are posted
            constitutes your acceptance of the revised Terms.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            11. Contact Us
          </h2>
          <p>
            If you have questions about these Terms &amp; Conditions, please
            contact us:
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

export default TermsPage;
