define(
    function (require) {
        var painters = {};

        // 这些属性不用加`px`
        var numberProperties = [
            'fontWeight', 'lineHeight',
            'opacity', 'zIndex', 'zoom'
        ];

        painters.style = function (name, property) {
            return {
                name: name,
                property: property || name,
                paint: function (control, value) {
                    if (typeof value === 'number'
                        && !numberProperties.hasOwnProperty(this.property)) {
                        value = value + 'px';
                    }
                    control.main.style[this.property] = value;
                }
            };
        };

        painters.html = function (name, member, generate) {
            return {
                name: name,
                member: member || 'main',
                generate: generate,
                paint: function (control, value) {
                    var element = control[this.member];
                    var html = typeof this.generate === 'function'
                        ? this.generate(control, value)
                        : value;
                    if (element) {
                        element.innerHTML = html;
                    }
                }
            };
        };

        painters.text = function (name, member, generate) {
            return {
                name: name,
                member: member || 'main',
                generate: generate,
                paint: function (control, value) {
                    var element = control[this.member];
                    var html = typeof this.generate === 'function'
                        ? this.generate(control, value)
                        : value;
                    if (element) {
                        element.innerHTML = require('./lib').encodeHTML(html);
                    }
                }
            };
        };

        painters.delegate = function (name, member, method) {
            return {
                name: name,
                member: this.member,
                method: this.method,
                paint: function (control, value) {
                    control[this.member][this.method](value);
                }
            };
        };

        return painters;
    }
);