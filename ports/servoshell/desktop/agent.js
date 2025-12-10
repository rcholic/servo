// agent.js - Geometry Extraction for Visual Grounding
// Extracts bounding boxes and z-index for interactive elements

(function() {
    let hasExecuted = false;

    function extractGeometry(triggerSource) {
        if (hasExecuted) return;
        hasExecuted = true;

        try {
            const tree = [];

            // Select all interactive elements
            const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');

            elements.forEach(el => {
                const rect = el.getBoundingClientRect();

                // Only get visible elements (width and height > 0)
                if (rect.width > 0 && rect.height > 0) {
                    const style = window.getComputedStyle(el);
                    const zIndex = style.zIndex === 'auto' ? 0 : parseInt(style.zIndex) || 0;

                    tree.push({
                        tag: el.tagName.toLowerCase(),
                        text: (el.innerText || "").replace(/\s+/g, " ").trim().substring(0, 50),
                        bbox: {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            w: Math.round(rect.width),
                            h: Math.round(rect.height)
                        },
                        is_visible: true,
                        z_index: zIndex
                    });
                }
            });

            const data = {
                engine: "servo",
                status: "success",
                url: window.location.href,
                layout_viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                interactable_elements: tree,
                source: triggerSource,
                timestamp: new Date().toISOString()
            };

            // Output to stdout (captured by Rust)
            console.log(JSON.stringify(data));
        } catch (e) {
            console.log(JSON.stringify({
                engine: "servo",
                status: "error",
                error: e.message,
                source: "agent_error"
            }));
        }
    }

    // 1. Immediate Check: If the page is already parsed (interactive) or done (complete)
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        extractGeometry("Immediate_ReadyState");
    } else {
        // 2. Event Listener: Wait for the DOM to be constructed
        document.addEventListener('DOMContentLoaded', () => {
            extractGeometry("Event_DOMContentLoaded");
        });

        // 3. Fallback: Also listen for full load just in case
        window.addEventListener('load', () => {
            extractGeometry("Event_Load");
        });
    }

    // 4. HARD TIMEOUT: If the page is stuck (ads/scripts), force output after 3 seconds
    setTimeout(() => {
        extractGeometry("ForceTimeout_3s");
    }, 3000);

})();
