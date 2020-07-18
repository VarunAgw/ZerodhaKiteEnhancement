// ==UserScript==
// @name         Kite
// @version      0.1
// @description  TradingView
// @author       Varun Agrawal <Varun@VarunAgw.com>
// @run-at       document-start
// @noframes
// @match        https://kite.zerodha.com/*
// @require      https://code.jquery.com/jquery-2.1.4.js
// @grant        none
// ==/UserScript==

"use strict"


let TM = {};
TM.waitUntilMore = function (selectors, callback, interval) {
    interval = interval || 50;
    var $old_elements = [];
    (function () {
        var $new_elements = $(selectors).not($old_elements);
        $old_elements = $(selectors);
        $new_elements.each(function (index) {
            callback.apply(this, [selectors, this]);
        });
        setTimeout(arguments.callee, interval);
    })();
};
TM.addStyle = function (code) {
    $("<style rel='stylesheet' type='text/css'>").text(code).appendTo("head");
};

$.fn.val2 = function (value) {
    const el = this[0];
    const lastValue = el.value;
    el.value = value;
    const event = new Event("input", {bubbles: true});
    event.simulated = true;

    try {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(el, value);
    } catch (e) {
        console.log(e);
        // Happens sometime
    }

    try {
        const tracker = el._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }
    } catch (e) {
        console.log(e);
        // Also, happens sometime
    }

    try {
        el.dispatchEvent(event);
    } catch (e) {
        console.log(e);
        // Also, happens sometime
    }
};

$.fn.click2 = function () {
    const el = this[0];
    const event = new Event("click", {bubbles: true});
    event.simulated = true;

    try {
        el.dispatchEvent(event);
    } catch (e) {
        console.log(e);
        // Also, happens sometime
    }
};

// ====================================================================================== Buy dialog

TM.waitUntilMore(".order-window-cover:not(:has(.varunagw-amount))", function () {
    $(this).find(".row.margin-required").append($(`<br><span class="varunagw-amount" style="padding-left: 0px;">
<label>Amount (₹): <input type="number" class="varunagw-amount-input" style="width: 60px;"></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="1000">1K</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="5000">5K</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="10,000">10K</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="15,000">15K</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="20,000">20K</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="25,000">25K</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="50,000">50K</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="75,000">75K</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="1,00,000">1L</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="1,50,000">1.5L</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="2,00,000">2L</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="3,00,000">3L</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="4,00,000">4L</a></label>
<label>&nbsp;<a href="#" class="varunagw-amount-selector" data-amount="5,00,000">5L</a></label>
</span>`));
});

function updateQuantity() {
    let price = parseFloat($(this).closest(".order-window-cover").find(".last-price").text().match(/[\d,\.]+/)[0].replace(/,/g, ""));
    let quantity = parseInt($(this).closest(".order-window-cover").find(".varunagw-amount-input").val() / price);
    if (quantity > 10) { // Round off all digit except first 2 digit to multiple of 5
        let multiple = Math.pow(10, quantity.toString().length - 1);
        let multiple2 = Math.pow(2, quantity.toString().length - 1);
        //multiple2 = 1; // Disable it
        quantity = Math.round(quantity * multiple2 / multiple) * multiple / multiple2;
    }

    $(this).closest(".order-window-cover").find(".content .quantity input").val2(quantity);
}

function updateAmount() {
    let price = parseFloat($(this).closest(".order-window-cover").find(".last-price").text().match(/[\d,\.]+/)[0].replace(/,/g, ""));
    let amount = parseInt($(this).closest(".order-window-cover").find(".content .quantity input").val() * price);
    $(this).closest(".order-window-cover").find(".varunagw-amount-input").val(amount);
}

$(document).on("click", ".order-window-cover .varunagw-amount-selector", function (e) {
    e.preventDefault();
    $(this).closest(".order-window-cover").find(".varunagw-amount-input").val($(this).data("amount").toString().replace(/,/g, ""));
    updateQuantity.apply(this)
    updateAmount.apply(this);
});

$(document).on("input change", ".order-window-cover .varunagw-amount-input", function () {
    updateQuantity.apply(this);
});

$(document).on("input change", ".order-window-cover .content .quantity input", function (e) {
    if (e.originalEvent.isTrusted == true) {
        updateAmount.apply(this);
    }
});


// Copy Symbol

$(document).on('click', '.vddl-list .instrument .symbol .nice-name', function (event) {
    if (event.altKey || !event.ctrlKey || !event.shiftKey) {
        return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();

    prompt("Copy it if you like!", $(event.target).text());
});

// ====================================================================================== Market Depth

(async function () {
    return;
    setTimeout(function () {
        $(".container-left").css("min-width", "550px");
        $(".marketwatch-sidebar").css("width", "550px");
        $(".marketwatch-selector").css("width", "550px");
        $(".header-left").css("min-width", "550px");
    }, 1000);

    while (true) {
        try {
            await TM.asyncDelay(500);
            if (!window.depth_enabled || document.hidden) {
                $(".varunagw-depth").css("display", "none");
                continue;
            } else {
                $(".varunagw-depth").css("display", "initial");
            }
            let instruments = [];
            $(".vddl-list .instrument").each(function () {
                let instrument =
                    ($(this).find(".symbol .exchange").text() === "" ? "NSE" : $(this).find(".symbol .exchange").text())
                    + ":" + $(this).find(".symbol .nice-name").text();

                instruments.push(instrument);
            });
            if (instruments.length === 0) {
                continue;
            }

            //let quotes = {"BSE:RELIANCE": 1};
            let quotes = await $.ajax({
                url: "https://trading.win/kite/quotesApi.php",
                method: "POST",
                data: {instruments: instruments},
            });
            $(".vddl-list .instrument").each(function (index) {
                let instrument =
                    ($(this).find(".symbol .exchange").text() === "" ? "NSE" : $(this).find(".symbol .exchange").text())
                    + ":" + $(this).find(".symbol .nice-name").text();

                let spread = "-";
                let colorSpread = "#A4A4A4"; // grey
                let depth1 = "-";
                let depthAmount1 = "";
                let color1 = "#4caf50"; // green
                let depth2 = "-";
                let depthAmount2 = "";
                let color2 = "#4caf50"; // green

                if (quotes[index] != null && quotes[index].original_instrument == instrument) {
                    let quote = quotes[index];
                    spread = (quote.spread === "-") ? "--" : Math.round(quote.spread * 100) / 100 + "%";
                    colorSpread = (quote.spread > 1 || quote.spread === "-") ? "#df514c" : "#A4A4A4";

                    if (quote.segment != "dOPT") {
                        depth1 = quote.depth_ratio
                        depthAmount1 = quote.depth_amount_display;
                        if (depth1 < 1) {
                            color1 = "#df514c";
                        }
                        depth1 += "x";
                        depth2 = quote.depth_ratio2;
                        depthAmount2 = quote.depth_amount_display2;
                        if (depth2 < 1) {
                            color2 = "#df514c";
                        }
                        depth2 += "x";
                    }
                }

                if ($(this).find(".varunagw-depth").length === 0) {
                    $(this).find(".price").children().first().css({"min-width": "52px"});
                    $(this).find(".price").prepend(`
<span class="varunagw-depth" style="min-width: 30px; padding-right: 4px;">
<span class="dim varunagw-spread-ratio" style="min-widZth: 30px;"></span>
<span style="min-width: 55px;"><span class="dim varunagw-depth-ratio1"></span><span class="varunagw-depth-amount1 text-xxsmall"></span></span>
<span style="min-width: 55px;"><span class="dim varunagw-depth-ratio2"></span><span class="varunagw-depth-amount2 text-xxsmall"></span></span>
</span>
`);
                }

                $(this).find(".varunagw-spread-ratio").css("color", colorSpread);
                $(this).find(".varunagw-spread-ratio").html2(spread);
                $(this).find(".varunagw-depth-ratio1").css("color", color2);
                $(this).find(".varunagw-depth-ratio1").html2(depth2);
                $(this).find(".varunagw-depth-amount1").html2("&nbsp;" + depthAmount2);
                $(this).find(".varunagw-depth-ratio2").css("color", color1);
                $(this).find(".varunagw-depth-ratio2").html2(depth1);
                $(this).find(".varunagw-depth-amount2").html2("&nbsp;" + depthAmount1);
            });

            //console.log(instruments);
        } catch (e) {
        }
    }
})();

// ====================================================================================== Hide Squared-off


window.hideSquaredOff = true;
$(function () {
    TM.addStyle(".varunagw-hidden {visibility: collapse;}");
});
$(document).on("click", ".varunagw-checkbox", function () {
    window.hideSquaredOff = !window.hideSquaredOff;
    if (window.hideSquaredOff) {
        TM.addStyle(".varunagw-hidden {visibility: collapse;}");
    } else {
        TM.addStyle(".varunagw-hidden {visibility: visible;}");
    }
});

function addToolbar() {
    if ($("div.toolbar span.varunagw-toolbar").length == 0) {
        $("div.toolbar").prepend('<span class="varunagw-toolbar"><label><input type="checkbox" class="varunagw-checkbox" checked="checked">&nbsp;Hide Squared off&nbsp;</label></span>');
    }
    $(".varunagw-checkbox").prop("checked", window.hideSquaredOff);
}

setInterval(function () {
    addToolbar();
    if (location.href == "https://kite.zerodha.com/holdings") {
        $("table tbody tr").each(function () {
            if ($(this).find("td:nth(1)").text().trim() == "0" && !$(this).hasClass("varunagw-hidden")) {
                $(this).addClass("varunagw-hidden");
            }
            if ($(this).find("td:nth(1)").text().trim() != "0" && $(this).hasClass("varunagw-hidden")) {
                $(this).removeClass("varunagw-hidden");
            }
        });
    }
    if (location.href == "https://kite.zerodha.com/orders") {
        $("table tbody tr").each(function () {
            let $td = $(this).find("td.order-status");
            let text = $td.text().trim();
            let visible = ["REJECTED", "CANCELLED AMO"].indexOf(text) === -1;
            if (!visible && !$(this).hasClass("varunagw-hidden")) {
                $(this).addClass("varunagw-hidden");
            }
            if (visible && $(this).hasClass("varunagw-hidden")) {
                $(this).removeClass("varunagw-hidden");
            }
        });
    }
    if (location.href == "https://kite.zerodha.com/positions") {
        $("table tbody tr").each(function () {
            if ($(this).find("td:nth(1)").hasClass("greyed") && !$(this).hasClass("varunagw-hidden")) {
                $(this).addClass("varunagw-hidden");
            }
            if (!$(this).find("td:nth(1)").hasClass("greyed") && $(this).hasClass("varunagw-hidden")) {
                $(this).removeClass("varunagw-hidden");
            }
        });
    }
}, 500);


// ====================================================================================== Declutter
setInterval(function () {
    $(".header-right a[href='/']").remove();
}, 500);

// ====================================================================================== GTT Link

$(document).on("click", ".varunagw-gtt-link", function (e) {
    e.preventDefault();
    $("a[href='/orders']").click2();
    setTimeout(function () {
        $(".page-nav a[href='/orders/gtt']").click2();
    }, 1);
});
setInterval(function () {
    if ($(".app-nav .varunagw-gtt-link").length == 0) {
        $("<a href='/orders/gtt' class='varunagw-gtt-link'><span>GTT</span></a>").insertAfter($(".app-nav a[href='/dashboard']"));
    }
}, 500);

// ====================================================================================== Depth Link

window.depth_enabled = true;

$(document).on("click", ".varunagw-depth-button", function (e) {
    e.preventDefault();
    window.depth_enabled = !window.depth_enabled;
    if (window.depth_enabled) {
        $(this).find("span").text("Disable Depth");
    } else {
        $(this).find("span").text("Enable Depth");
    }
});

setInterval(function () {
    return;
    if ($(".app-nav .varunagw-depth-button").length == 0) {
        $("<a href='#' class='varunagw-depth-button'><span>Disable Depth</span></a>").insertBefore($(".app-nav a[href='/dashboard']"));
    }
}, 500);

// ====================================================================================== Zoom levels

window.zoomLevel = 1;
$(document).on("click", ".varunagw-zoom-button", function (e) {
    e.preventDefault();
    window.zoomLevel++;
    if (window.zoomLevel > 5) {
        window.zoomLevel = 1;
    }
    if (window.zoomLevel == 1) {
        TM.addStyle(".marketwatch-sidebar .instruments .instrument .info .price, .marketwatch-sidebar .instruments .instrument .info .symbol {padding: 13px 15px}");
        TM.addStyle(".vddl-list.list-flat {zoom: 100%}");
    } else if (window.zoomLevel == 2) {
        TM.addStyle(".marketwatch-sidebar .instruments .instrument .info .price, .marketwatch-sidebar .instruments .instrument .info .symbol {padding: 12px 15px}");
        TM.addStyle(".vddl-list.list-flat {zoom: 99%}");
    } else if (window.zoomLevel == 3) {
        TM.addStyle(".marketwatch-sidebar .instruments .instrument .info .price, .marketwatch-sidebar .instruments .instrument .info .symbol {padding: 10px 15px}");
        TM.addStyle(".vddl-list.list-flat {zoom: 95%}");
    } else if (window.zoomLevel == 4) {
        TM.addStyle(".marketwatch-sidebar .instruments .instrument .info .price, .marketwatch-sidebar .instruments .instrument .info .symbol {padding: 8px 15px}");
        TM.addStyle(".vddl-list.list-flat {zoom: 90%}");
    } else {
        TM.addStyle(".marketwatch-sidebar .instruments .instrument .info .price, .marketwatch-sidebar .instruments .instrument .info .symbol {padding: 5px 15px}");
        TM.addStyle(".vddl-list.list-flat {zoom: 80%}");
    }
    $(this).find("span").text("Zoom: " + window.zoomLevel);
});

setInterval(function () {
    if ($(".app-nav .varunagw-zoom-button").length == 0) {
        $("<a href='#' class='varunagw-zoom-button'><span>Zoom: 1</span></a>").insertBefore($(".app-nav a[href='/dashboard']"));
    }
}, 500);
