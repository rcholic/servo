// agent.js - Browser Context Version (No Node.js dependencies)

(function() {
    let hasExecuted = false;

    function outputAndExit(triggerSource) {
        if (hasExecuted) return;
        hasExecuted = true;

        try {
            const data = {
                url: window.location.href, // Get actual current URL
                title: document.title || "No Title",
                // Grab text, collapse whitespace, limit to 10k chars
                content: (document.body ? document.body.innerText : "").replace(/\s+/g, ' ').trim().substring(0, 10000),
                status: "success",
                source: triggerSource,
                timestamp: new Date().toISOString()
            };
            // This goes to stdout, which Rust captures
            console.log(JSON.stringify(data));
        } catch (e) {
            console.log(JSON.stringify({ error: e.message, source: "agent_error" }));
        }
    }

    // 1. Immediate Check: If the page is already parsed (interactive) or done (complete)
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        outputAndExit("Immediate_ReadyState");
    } else {
        // 2. Event Listener: Wait for the DOM to be constructed
        document.addEventListener('DOMContentLoaded', () => {
            outputAndExit("Event_DOMContentLoaded");
        });

        // 3. Fallback: Also listen for full load just in case
        window.addEventListener('load', () => {
            outputAndExit("Event_Load");
        });
    }

    // 4. HARD TIMEOUT: If the page is stuck (ads/scripts), force output after 3 seconds
    setTimeout(() => {
        outputAndExit("ForceTimeout_3s");
    }, 3000);

})();
