/*
 * THE RACK - QR Codes & Bin Tags
 * Version: 2.12.22
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.22: Enhanced PDF and print rendering with improved scaling, font handling, and print layout
 * - 2.12.21: Fixed PDF Row 2 centering
 * - 2.12.20: Adjusted padding calculations
 */

function prepareBinTagForPrint(tagDiv, cardWidthPx, cardHeightPx) {
    // Add print-specific styling
    var printStyle = document.createElement('style');
    printStyle.innerHTML = `
        @media print {
            body { 
                margin: 0; 
                padding: 0; 
                display: flex;
                justify-content: center;
            }
            .bin-tag-container {
                width: ${cardWidthPx}px !important;
                max-width: ${cardWidthPx}px !important;
                margin: 0 auto !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            table {
                width: 100% !important;
                border-collapse: collapse !important;
            }
            td {
                padding: 4px !important;
                vertical-align: middle !important;
                text-align: center !important;
            }
        }
    `;
    document.head.appendChild(printStyle);

    // Add print-specific classes and attributes
    tagDiv.classList.add('bin-tag-container');
    tagDiv.setAttribute('data-print-width', cardWidthPx);
    tagDiv.setAttribute('data-print-height', cardHeightPx);

    return tagDiv;
}

function enhancedHtml2Canvas(element, options) {
    // Extend html2canvas with improved settings
    var defaultOptions = {
        scale: 4,  // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        letterRendering: true  // Improve font rendering
    };

    // Merge provided options with defaults
    var finalOptions = Object.assign({}, defaultOptions, options || {});

    return html2canvas(element, finalOptions);
}

// In your main bin tag generation function, replace existing html2canvas calls:
// FROM:
//   html2canvas(tagDiv, { scale: 3, useCORS: true, ... })
// TO:
//   enhancedHtml2Canvas(prepareBinTagForPrint(tagDiv, cardWidthPx, cardHeightPx))
