import RouteLandingPage from "../components/RouteLandingPage";

export default function HoustonToMiamiPage() {
    return (
        <RouteLandingPage
            fromCity="Houston"
            fromState="TX"
            toCity="Miami"
            toState="FL"
            seoTitle="Houston to Miami Car Shipping | Road America Auto Transport"
            seoDescription="Need to ship a car from Houston, TX to Miami, FL? Get a free, instant auto transport quote from Road America. Fast, reliable, and fully insured."
            customHeading={
                <>Houston to Miami <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Car Shipping</span></>
            }
            customText={
                <p>
                    Relocating or buying a car? We make shipping your vehicle from Houston, Texas to Miami, Florida simple and stress-free.
                    Hand-calculated quotes by ASE Master Techs. Delivered via email. No unsolicited calls.
                </p>
            }
        />
    );
}
