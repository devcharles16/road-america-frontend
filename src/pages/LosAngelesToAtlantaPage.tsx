import RouteLandingPage from "../components/RouteLandingPage";

export default function LosAngelesToAtlantaPage() {
    return (
        <RouteLandingPage
            fromCity="Los Angeles"
            fromState="CA"
            toCity="Atlanta"
            toState="GA"
            seoTitle="Los Angeles to Atlanta Car Shipping | Road America Auto Transport"
            seoDescription="Need to ship a car from Los Angeles, CA to Atlanta, GA? Get a free, instant auto transport quote from Road America. Fast, reliable, and fully insured."
            customHeading={
                <>Los Angeles to Atlanta <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-redSoft">Car Shipping</span></>
            }
            customText={
                <p>
                    Relocating or buying a car? We make shipping your vehicle from Los Angeles, CA to Atlanta, GA simple and stress-free.
                    Hand-calculated quotes by ASE Master Techs. Delivered via email. No unsolicited calls.
                </p>
            }
        />
    );
}
