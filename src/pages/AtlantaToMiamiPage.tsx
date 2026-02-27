import RouteLandingPage from "../components/RouteLandingPage";

export default function AtlantaToMiamiPage() {
    return (
        <RouteLandingPage
            fromCity="Atlanta"
            fromState="GA"
            toCity="Miami"
            toState="FL"
            seoTitle="Atlanta to Miami Car Shipping | Road America Auto Transport"
            seoDescription="Need to ship a car from Atlanta, GA to Miami, FL? Get a free, instant auto transport quote from Road America. Fast, reliable, and fully insured."
            customHeading={
                <>Atlanta to Miami <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Car Shipping</span></>
            }
            customText={
                <p>
                    Relocating or buying a car? We make shipping your vehicle from Atlanta to Miami simple and stress-free.
                    Hand-calculated quotes by ASE Master Techs. Delivered via email. No unsolicited calls.
                </p>
            }
        />
    );
}
