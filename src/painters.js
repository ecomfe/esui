define(
    function (require) {
        var painters = {};

        // 这些属性不用加`px`
        var numberProperties = [
            'fontWeight', 'lineHeight',
            'opacity', 'zIndex', 'zoom'
        ];

        /**
         * 修改`main`元素的样式
         *
         * @param {string} name 指定负责的属性名
         * @param {string=} property 对应的样式属性名，默认与`name`相同
         */
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

        /**
         * 修改指定成员的`innerHTML`
         *
         * @param {string} name 指定负责的属性名
         * @param {string=} member 指定成员，默认为`main`
         * @param {function=} generate 指定生成HTML的函数
         */
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

        /**
         * 修改指定成员的`innerText`
         *
         * @param {string} name 指定负责的属性名
         * @param {string=} member 指定成员，默认为`main`
         * @param {function=} generate 指定生成HTML的函数，
         * 该函数只返回HTML，不需要转义
         */
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


        /**
         * 将修改代理到指定成员的指定方法上
         *
         * @param {string} name 指定负责的属性名
         * @param {string} member 指定成员名
         * @param {string} method 指定调用的方法名称
         */
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