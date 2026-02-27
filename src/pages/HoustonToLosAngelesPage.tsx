import RouteLandingPage from "../components/RouteLandingPage";

export default function HoustonToLosAngelesPage() {
    return (
        <RouteLandingPage
            fromCity="Houston"
            fromState="TX"
            toCity="Los Angeles"
            toState="CA"
            seoTitle="Houston to Los Angeles Car Shipping | Road America Auto Transport"
            seoDescription="Need to ship a car from Houston, TX to Los Angeles, CA? Get a free, instant auto transport quote from Road America. Fast, reliable, and fully insured."
            customHeading={
                <>Houston to Los Angeles <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Car Shipping</span></>
            }
            customText={
                <p>
                    Relocating or buying a car? We make shipping your vehicle from Houston, TX to Los Angeles, CA simple and stress-free.
                    Hand-calculated quotes by ASE Master Techs. Delivered via email. No unsolicited calls.
                </p>
            }
        />
    );
}
