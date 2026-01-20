
const OptInPage = () => {
    return (
        <div className="min-h-screen bg-[#121212] pt-32 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
                    Opt In
                </h1>

                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                    <iframe
                        src="https://docs.google.com/forms/d/e/1FAIpQLSeE9KoBoXLwGMmfNWbU19Lk-dtc-gdEnjUjXogbW-ipscVQdQ/viewform?embedded=true"
                        width="100%"
                        height="1840"
                        frameBorder="0"
                        marginHeight={0}
                        marginWidth={0}
                        className="w-full bg-transparent"
                        title="Opt-In Form"
                    >
                        Loading…
                    </iframe>
                </div>
            </div>
        </div>
    );
};

export default OptInPage;
