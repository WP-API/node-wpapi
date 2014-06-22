(function($) {

    "use strict";

    $.fn.offscreenTrigger = function(className, triggerElement, offset) {

        var scrollUpdateNeeded = false;

        var target = this;

        var previousTriggers = target.data().ksScrollStyles;
        var key = triggerElement + "|" + className;
        if (previousTriggers && previousTriggers.hasOwnProperty(key)) {
            return this;
        }

        if (!previousTriggers) {
            previousTriggers = {};
        }

        previousTriggers[key] = true;
        target.data("ksScrollStyles", previousTriggers);

        if (offset === undefined) offset = 0;
        var triggerElementPosition = $(triggerElement).offset().top;

        $(window).scroll(function() {

            if (!scrollUpdateNeeded) {

                scrollUpdateNeeded = true;

                setTimeout(function() {

                    scrollUpdateNeeded = false;

                    if ($(window).scrollTop() > triggerElementPosition - offset) {
                        target.addClass(className);
                    } else {
                        target.removeClass(className);
                    }
                }, 33);
            }

        });

        return this;

    };

}(jQuery));