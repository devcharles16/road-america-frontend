import RouteLandingPage from "../components/RouteLandingPage";

export default function NewYorkToMiamiPage() {
    return (
        <RouteLandingPage
            fromCity="New York"
            fromState="NY"
            toCity="Miami"
            toState="FL"
            seoTitle="New York to Miami Car Shipping | Road America Auto Transport"
            seoDescription="Need to ship a car from New York, NY to Miami, FL? Get a free, instant auto transport quote from Road America. Fast, reliable, and fully insured."
            customHeading={
                <>New York to Miami <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Car Shipping</span></>
            }
            customText={
                <p>
                    Relocating or buying a car? We make shipping your vehicle from New York to Miami simple and stress-free. Snowbird transport experts.
                    Hand-calculated quotes by ASE Master Techs. Delivered via email. No unsolicited calls.
                </p>
            }
        />
    );
}
