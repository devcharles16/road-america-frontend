// src/pages/TermsPage.tsx
import SEO from "../components/SEO";

const TermsPage = () => {
  return (
    <main className="min-h-screen bg-brand-dark px-4 py-12 text-white">
      <SEO
        title="Terms & Conditions"
        description="Road America Auto Transport Terms & Conditions. Read our service agreement, liability limitations, and cancellation policies."
        canonical="/terms"
      />
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <h1 className="font-display text-3xl font-bold">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-white/60">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <p className="mt-6 text-sm leading-6 text-white/75">
            These Terms &amp; Conditions (“Terms”) constitute a legally binding
            agreement between <span className="font-semibold text-white">Road America Auto Transport</span>{" "}
            (“Road America Auto Transport,” “RA,” “we,” “us,” or “our”) and the customer (“Customer,”
            “you,” or “your”). By requesting services, booking transportation, submitting
            payment, or otherwise authorizing Road America Auto Transport to arrange transportation,
            you acknowledge that you have read, understood, and agreed to these Terms.
          </p>
        </header>

        {/* 1 */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">
            1. Role of Road America Auto Transport (Broker Disclosure)
          </h2>

          <p className="text-sm leading-6 text-white/75">
            Road America Auto Transport is a <span className="font-semibold text-white">licensed transportation broker</span>,
            not a motor carrier. Road America Auto Transport arranges transportation services by matching customers with{" "}
            <span className="font-semibold text-white">federally licensed and insured motor carriers</span>{" "}
            registered with the Federal Motor Carrier Safety Administration (FMCSA).
          </p>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm font-semibold text-white">Road America Auto Transport does not:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
              <li>Transport vehicles</li>
              <li>Take physical possession of vehicles</li>
              <li>Act as a carrier</li>
              <li>Assume carrier liability for loss or damage</li>
            </ul>
            <p className="mt-4 text-sm text-white/75">
              All transportation services are performed by independent third-party carriers.
            </p>
          </div>
        </section>

        {/* 2 */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">2. Contract Formation</h2>

          <p className="text-sm leading-6 text-white/75">
            This agreement becomes binding upon the earliest of:
          </p>

          <ul className="list-disc space-y-2 pl-5 text-sm text-white/75">
            <li>Customer’s written or electronic acceptance of these Terms, or</li>
            <li>
              Submission of payment, deposit, or authorization for Road America Auto Transport to begin
              dispatch or carrier-sourcing efforts.
            </li>
          </ul>
        </section>

        {/* 3 */}
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-white">
            3. Service Types &amp; Payment Structure
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* GOLD */}
            <div className="rounded-2xl border border-yellow-400/30 bg-black/40 p-6 shadow-soft-card">
              <h3 className="mb-4 text-lg font-semibold text-yellow-400">
                Gold Package
              </h3>

              <ul className="space-y-2 text-sm text-white/80">
                <li>• Road America Auto Transport manages full logistics coordination</li>
                <li>• Customer pays Road America Auto Transport the full transport amount</li>
                <li>• Road America Auto Transport pays the carrier directly</li>
                <li>• Includes broker fee and applicable electronic payment processing fees</li>
              </ul>

              <div className="mt-4 text-xs text-yellow-300/80">
                Best for clients who want hands-off, full-service transport
              </div>
            </div>

            {/* SILVER */}
            <div className="rounded-2xl border border-white/15 bg-black/30 p-6 shadow-soft-card">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Silver Package
              </h3>

              <ul className="space-y-2 text-sm text-white/80">
                <li>• Road America Auto Transport secures a carrier</li>
                <li>• Customer pays Road America Auto Transport the broker fee plus applicable processing fees</li>
                <li>
                  • Customer pays the carrier directly at delivery (typically in cash,
                  certified funds, or as specified by the carrier)
                </li>
              </ul>

              <div className="mt-4 text-xs text-white/60">
                Best for budget-focused clients comfortable paying carriers directly
              </div>
            </div>
          </div>

          {/* 3.5 / 3.6 (recommended protections) */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
              <h3 className="text-lg font-semibold text-white">3.5 Pricing &amp; Quote Accuracy</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">
                All price quotes provided by Road America Auto Transport are estimates based on the
                information supplied by the Customer and current market conditions.
                Carrier pricing is not guaranteed and may change due to fuel costs,
                supply and demand, vehicle size, vehicle condition, route, seasonality,
                or carrier availability. If the carrier’s final price differs from the
                original quote, Customer agrees to pay the adjusted amount required to
                secure transport.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
              <h3 className="text-lg font-semibold text-white">3.6 Inaccurate or Incomplete Information</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">
                If the Customer provides inaccurate or incomplete vehicle information
                including but not limited to size, weight, operability, modifications,
                or pickup accessibility, Road America Auto Transport and the carrier may adjust pricing,
                cancel the order, or refuse transport. Additional fees may apply and are
                the sole responsibility of the Customer.
              </p>
            </div>
          </div>
        </section>

        {/* 4 */}
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-white">
            4. Dispatch, Cancellation &amp; Refund Policy
          </h2>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dispatch */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
              <h3 className="mb-3 text-lg font-semibold text-white">Dispatch Defined</h3>

              <p className="text-sm leading-6 text-white/75">
                “Dispatch” occurs when Road America Auto Transport has begun carrier sourcing, posted
                the load, negotiated pricing, reserved carrier capacity, or otherwise
                initiated efforts to assign a carrier.
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white/80">Examples include:</p>
                <ul className="mt-2 space-y-1 text-xs text-white/70">
                  <li>• Posting your route to carrier networks</li>
                  <li>• Negotiating carrier pricing or pickup windows</li>
                  <li>• Reserving capacity or confirming availability</li>
                </ul>
              </div>
            </div>

            {/* Refund */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
              <h3 className="mb-3 text-lg font-semibold text-white">Refund Policy</h3>

              <div className="space-y-4 text-sm text-white/75">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="font-semibold text-emerald-200">Before dispatch</p>
                  <p className="mt-1 text-xs leading-5 text-white/75">
                    Refunds may be issued at Road America Auto Transport’s discretion, minus all merchant
                    and processing fees.
                  </p>
                </div>

                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                  <p className="font-semibold text-red-200">After dispatch</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-white/80">
                    <li>• No refunds</li>
                    <li>• Broker fees are fully earned</li>
                    <li>• Merchant/processing fees are never refundable</li>
                  </ul>
                </div>

                <p className="text-xs leading-5 text-white/60">
                  Carrier cancellation, weather delays, mechanical issues, or schedule changes
                  do not entitle the Customer to a refund once dispatch efforts have begun.
                </p>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/80">Important:</p>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    Failure to accept a carrier due to price adjustments, vehicle condition,
                    or scheduling changes does not entitle the Customer to a refund once dispatch
                    has begun.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">5. Pickup &amp; Delivery Terms</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <ul className="list-disc space-y-2 pl-5 text-sm text-white/75">
              <li>
                Pickup and delivery dates are <span className="font-semibold text-white">estimates only</span> and are not guaranteed.
              </li>
              <li>
                Delivery may occur at the nearest safe and legal location due to road restrictions,
                vehicle size, weather, or safety concerns.
              </li>
              <li>
                Customer is responsible for ensuring vehicle accessibility at pickup and delivery.
              </li>
            </ul>
          </div>
        </section>

        {/* 6 */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">6. Vehicle Condition &amp; Preparation</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm font-semibold text-white">Customer represents and warrants that:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
              <li>Vehicle is accurately described (operable or inoperable)</li>
              <li>
                Vehicle has no personal belongings, hazardous materials, illegal items, firearms,
                alcohol, drugs, or electronics inside
              </li>
              <li>Fuel level does not exceed approximately one-quarter (¼) tank</li>
              <li>Alarm systems are disabled</li>
              <li>Any aftermarket modifications are disclosed</li>
            </ul>

            <p className="mt-5 text-sm font-semibold text-white">
              Road America Auto Transport and the carrier are not responsible for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
              <li>Pre-existing damage</li>
              <li>Mechanical failures</li>
              <li>Fluid leaks</li>
              <li>Battery issues</li>
              <li>Suspension or undercarriage damage on low-clearance vehicles</li>
            </ul>
          </div>
        </section>

        {/* 7 */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">7. Personal Property Disclaimer</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm leading-6 text-white/75">
              Personal items are <span className="font-semibold text-white">not permitted</span> inside vehicles unless expressly
              authorized by the carrier. Road America Auto Transport and carriers assume{" "}
              <span className="font-semibold text-white">no liability</span> for loss, theft, or damage to personal property
              left inside the vehicle.
            </p>
          </div>
        </section>

        {/* 8 */}
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-white">
            8. Insurance &amp; Liability Disclosure (Mandatory Acknowledgment)
          </h2>
          <p className="text-sm leading-6 text-white/75">
            All carriers dispatched by Road America Auto Transport are required to maintain active cargo and liability insurance and provide proof of coverage prior to dispatch. Upon request, customers may also obtain a copy of the carrier’s Certificate of Insurance directly from the carrier for their records. Road America does not act as an insurer and does not provide cargo insurance coverage.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
              <h3 className="mb-2 text-lg font-semibold text-white">Customer Acknowledgment</h3>

              <p className="text-sm leading-6 text-white/75">
                By booking transport services, the Customer acknowledges and agrees to the following:
              </p>

              <ul className="mt-4 space-y-2 text-sm text-white/85">
                <li>
                  • <span className="font-semibold text-white">Road America Auto Transport is a broker</span>, not a motor carrier
                </li>
                <li>• The transporting carrier’s cargo insurance applies during transit</li>
                <li>• Road America Auto Transport’s liability is limited to its role as a broker</li>
                <li>• Carrier insurance coverage may include exclusions and deductibles</li>
                <li>
                  • <span className="font-semibold text-white">Supplemental insurance</span> is the Customer’s responsibility if desired
                </li>
              </ul>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white/80">Important</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Customers can request a copy of the assigned carrier’s insurance certificate upon dispatch
                  and review coverage limits, exclusions, and deductible amounts.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-red/25 bg-brand-red/10 p-6 shadow-soft-card">
              <h3 className="mb-2 text-lg font-semibold text-white">Liability Disclosure</h3>

              <p className="text-sm leading-6 text-white/80">
                The transporting motor carrier is responsible for loss or damage occurring during transport,
                subject to the carrier’s insurance terms and the Bill of Lading.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-white/85">
                <li>• Claims must be pursued primarily through the carrier’s insurance</li>
                <li>• Pre-existing damage and mechanical issues are not covered</li>
                <li>• Delays caused by weather, traffic, or mechanical issues are not guaranteed events</li>
                <li>• Broker liability (if any) is limited to fees paid to Road America Auto Transport</li>
              </ul>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold text-white/80">Reminder</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Inspect the vehicle at pickup and delivery, and ensure all new damage is documented on the
                  Bill of Lading before signing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9 */}
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-white">9. Damage Claims Procedure</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
              <h3 className="mb-2 text-lg font-semibold text-white">Strict Requirements</h3>
              <p className="text-sm leading-6 text-white/75">
                To be valid, all damage claims must meet all requirements below.
              </p>

              <ol className="mt-4 space-y-3 text-sm text-white/80">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-white">Note it on the Bill of Lading</p>
                    <p className="text-xs leading-5 text-white/60">
                      Damage must be written on the Bill of Lading at delivery{" "}
                      <span className="font-semibold text-white/80">before the vehicle is moved</span>.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-white">Take photos</p>
                    <p className="text-xs leading-5 text-white/60">
                      Document the condition clearly with photographs at delivery.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-white">Submit in writing by email only</p>
                    <p className="text-xs leading-5 text-white/60">
                      Claims must be submitted by email (no phone or verbal claims).
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-white">Send within 15 calendar days</p>
                    <p className="text-xs leading-5 text-white/60">
                      Claims must be submitted within{" "}
                      <span className="font-semibold text-white/80">fifteen (15)</span> calendar days of delivery.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white/80">Claims Email</p>
                <p className="mt-1 text-sm font-semibold text-brand-red">
                  claims@roadamericatransport.com
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 shadow-soft-card">
              <h3 className="mb-2 text-lg font-semibold text-red-200">Enforcement Clause</h3>

              <p className="text-sm leading-6 text-white/80">
                Failure to comply with <span className="font-semibold text-white">any</span> requirement above voids the claim.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-white/85">
                <li>• Road America Auto Transport does not process verbal or phone claims</li>
                <li>• Late submissions are not accepted</li>
                <li>• Claims not noted on the Bill of Lading at delivery are invalid</li>
              </ul>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs leading-5 text-white/70">
                  Tip: Before signing the Bill of Lading, inspect your vehicle carefully in good lighting
                  and take photos from all angles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 10 */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">10. Limitation of Broker Liability</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm leading-6 text-white/75">Road America Auto Transport shall not be liable for:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
              <li>Carrier delays</li>
              <li>Acts or omissions of carriers</li>
              <li>Mechanical failures</li>
              <li>Weather delays</li>
              <li>Acts of God</li>
              <li>Consequential, incidental, or indirect damages</li>
            </ul>
            <p className="mt-4 text-sm text-white/75">
              Broker liability, if any, is strictly limited to the broker fee actually paid.
            </p>
          </div>
        </section>

        {/* 11 */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">11. Indemnification</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm leading-6 text-white/75">
              Customer agrees to indemnify and hold harmless Road America from any claims,
              damages, fines, penalties, or expenses arising from:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
              <li>Inaccurate vehicle information</li>
              <li>Prohibited items in the vehicle</li>
              <li>Failure to comply with these Terms</li>
              <li>Acts or omissions of the Customer or their agents</li>
            </ul>
          </div>
        </section>

        {/* 12 */}
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-white">12. Dispute Resolution</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
              <h3 className="mb-2 text-lg font-semibold text-white">Step 1: Mediation First</h3>
              <p className="text-sm leading-6 text-white/75">
                Any dispute arising out of or relating to these Terms shall first be submitted
                to good-faith mediation. The parties agree to cooperate and make reasonable efforts
                to resolve the dispute before escalating further.
              </p>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white/80">Why mediation?</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Mediation is typically faster, lower cost, and avoids unnecessary legal proceedings.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
              <h3 className="mb-2 text-lg font-semibold text-white">Step 2: Binding Arbitration</h3>

              <p className="text-sm leading-6 text-white/75">
                If mediation fails, disputes shall be resolved by binding arbitration.
                Arbitration will be conducted on an{" "}
                <span className="font-semibold text-white">individual basis only</span>.
              </p>

              <div className="mt-4 rounded-xl border border-brand-red/20 bg-brand-red/10 p-4">
                <p className="text-sm font-semibold text-white">Arbitration Terms</p>
                <ul className="mt-2 space-y-2 text-xs leading-5 text-white/80">
                  <li>• No class actions</li>
                  <li>• No consolidated or representative claims</li>
                  <li>• Arbitration shall be conducted in the State of Florida</li>
                </ul>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/60">
                Nothing in this section prevents either party from seeking relief in small claims court
                where permitted by law.
              </p>
            </div>
          </div>
        </section>

        {/* 13 */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold text-white">13. Governing Law &amp; Venue</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm leading-6 text-white/75">
              These Terms are governed by the laws of the{" "}
              <span className="font-semibold text-white">State of Florida</span>, without regard to conflict-of-law principles.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold text-white/80">Venue</p>
              <p className="mt-1 text-xs leading-5 text-white/70">
                Any permitted court proceedings shall be brought exclusively in{" "}
                <span className="font-semibold text-white">Florida</span>.
              </p>
            </div>
          </div>
        </section>

        {/* 14 */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold text-white">14. Severability</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm leading-6 text-white/75">
              If any provision of these Terms is found unenforceable, the remaining provisions shall remain
              in full force and effect.
            </p>
          </div>
        </section>

        {/* 15 */}
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold text-white">15. Entire Agreement &amp; Modifications</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm leading-6 text-white/75">
              These Terms constitute the entire agreement between the parties regarding the services offered
              by Road America Auto Transport.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white/80">Updates</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Road America Auto Transport may update these Terms at any time by posting the revised version on its website.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white/80">Acceptance</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Continued use of our services after updates are posted constitutes acceptance of the revised Terms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 16 */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">16. Contact Information</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm leading-6 text-white/75">
              Customer communications should be directed through official Road America Auto Transport communication channels.
              Damage claims are accepted <span className="font-semibold text-white">by email only</span> as stated above.
            </p>
          </div>
        </section>

        {/* 17 */}
        <section className="mt-10 space-y-4 pb-6">
          <h2 className="text-xl font-bold text-white">17. Electronic &amp; SMS Communications</h2>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-soft-card">
            <p className="text-sm leading-6 text-white/75">
              By providing a phone number, email address, or submitting a request through our website,
              Customer consents to receive communications from Road America Auto Transport via phone, email, and SMS for purposes
              related to quotes, dispatch, transport updates, billing, and customer service.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs leading-5 text-white/70">
                Consent to receive SMS messages is not a condition of purchasing any services. Message and data rates
                may apply. Customers may opt out of SMS communications at any time by replying STOP.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TermsPage;
