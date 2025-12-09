const targetUrl = process.argv[2];

// Helper to print and signal exit
function outputAndExit(source) {
    try {
        const data = {
            url: targetUrl,
            title: document.title || "No Title",
            // Grab text, collapse whitespace, limit length
            content: (document.body.innerText || "").replace(/\s+/g, ' ').trim().substring(0, 10000),
            status: "success",
            source: source,
            timestamp: new Date().toISOString()
        };
        // This is the line the Rust reader is waiting for
        console.log(JSON.stringify(data));
    } catch (e) {
        console.log(JSON.stringify({ error: e.message }));
    }
    // We rely on the Rust API server to kill us, but we stop processing.
}

// 1. FAST PATH: As soon as the DOM structure is ready (ignore images/css/ads)
document.addEventListener('DOMContentLoaded', () => {
    outputAndExit("DOMContentLoaded");
});

// 2. BACKUP: If DOMContentLoaded fails or hangs, force output after 4s
setTimeout(() => {
    outputAndExit("ForceTimeout_4s");
}, 4000);

// Start the navigation
window.location.href = targetUrl;
