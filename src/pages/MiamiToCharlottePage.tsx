import RouteLandingPage from "../components/RouteLandingPage";

export default function MiamiToCharlottePage() {
    return (
        <RouteLandingPage
            fromCity="Miami"
            fromState="FL"
            toCity="Charlotte"
            toState="NC"
            seoTitle="Miami to Charlotte Car Shipping | Road America Auto Transport"
            seoDescription="Need to ship a car from Miami, FL to Charlotte, NC? Get a free, instant auto transport quote from Road America. Fast, reliable, and fully insured."
            customHeading={
                <>Miami to Charlotte <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Car Shipping</span></>
            }
            customText={
                <p>
                    Relocating or buying a car? We make shipping your vehicle from Miami, Florida to Charlotte, North Carolina simple and stress-free.
                    Hand-calculated quotes by ASE Master Techs. Delivered via email. No unsolicited calls.
                </p>
            }
        />
    );
}
