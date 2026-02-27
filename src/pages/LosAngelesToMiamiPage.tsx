import RouteLandingPage from "../components/RouteLandingPage";

export default function LosAngelesToMiamiPage() {
    return (
        <RouteLandingPage
            fromCity="Los Angeles"
            fromState="CA"
            toCity="Miami"
            toState="FL"
            seoTitle="Los Angeles to Miami Car Shipping | Road America Auto Transport"
            seoDescription="Need to ship a car from Los Angeles, CA to Miami, FL? Get a free, instant auto transport quote from Road America. Fast, reliable, and fully insured."
            customHeading={
                <>Los Angeles to Miami <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Car Shipping</span></>
            }
            customText={
                <p>
                    Relocating or buying a car? We make shipping your vehicle from Los Angeles, California to Miami, Florida simple and stress-free.
                    Hand-calculated quotes by ASE Master Techs. Delivered via email. No unsolicited calls.
                </p>
            }
        />
    );
}
