beforeEach(function() {
    this.addMatchers({
        toBeOfType: function(type) {
            return {}.toString.call(this.actual).slice(8, -1).toUpperCase() === type.toUpperCase();
        }
    });
});