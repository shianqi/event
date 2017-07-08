var $ = function(selector, context) {
    return new $.fn.init(selector, context);
};

$.fn = $.prototype;

$.fn.init = function(selector, context) {
    var nodeList = (context || document).querySelectorAll(selector);
    this.length = nodeList.length;
    for (var i=0; i<this.length; i+=1) {
        this[i] = nodeList[i];
    }
    return this;
};
$.fn.each = function(fn) {
    for (var i=0; i<this.length; i+=1) {
        fn.call(this[i], i, this[i]);
    }
    return this;
};

$.fn.hide = function() {
    this.each(function() {
       this.style.display = "none";
    });
};

$.fn.init.prototype = $.fn;
