define(
    // 你说为啥要有这么个控件？因为有2货喜欢在验证提示里放别的控件！
    // 你说为啥这东西不继承`Label`？因为有2货要往里放控件！
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        function ValidityLabel() {
            Control.apply(this, arguments);
        }

        ValidityLabel.prototype.type = 'ValidityLabel';

        ValidityLabel.prototype.createMain = function () {
            return document.createElement('for');
        };

        ValidityLabel.prototype.initStructure = function () {
            if (this.main.nodeName.toLowerCase() === 'label') {
                if (this.focusTarget) {
                    lib.setAttribute(this.main, 'for', this.focusTarget.id);
                }
            }
        };

        ValidityLabel.prototype.display = function (validity) {
            this.disposeChildren();
            var message = validity.getCustomMessage();
            if (!message) {
                var states = validity.getStates();
                for (var i = 0; i < states.length; i++) {
                    var state = states[i];
                    if (!state.getState()) {
                        message = state.getMessage();
                        break;
                    }
                }
            }
            this.main.innerHTML = message;
            this.initChildren();
        };

        // 这个控件是不能从`main.init()`生成的，只能通过`InputControl`直接构建出来，
        // 所以不在`main`下注册
        lib.inherits(ValidityLabel, Control);
        return ValidityLabel;
    }
);