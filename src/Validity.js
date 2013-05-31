define(
    // 你说为啥要有这么个控件？因为有2货喜欢在验证提示里放别的控件！
    // 你说为啥这东西不继承`Label`？因为有2货要往里放控件！
    // 你说为啥名字不叫`ValidityLabel`？CSS样式里看到`validitylabel`多丑！
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        function Validity() {
            Control.apply(this, arguments);
        }

        Validity.prototype.type = 'Validity';

        Validity.prototype.createMain = function () {
            return document.createElement('label');
        };

        Validity.prototype.initStructure = function () {
            if (this.main.nodeName.toLowerCase() === 'label') {
                if (this.focusTarget) {
                    lib.setAttribute(this.main, 'for', this.focusTarget.id);
                }
            }
        };

        function getClasses(label, state) {
            var classes = [].concat(
                helper.getPartClasses(label),
                helper.getPartClasses(label.target, 'validity'),
                helper.getPartClasses(label, state),
                helper.getPartClasses(label.target, 'validity-' + state)
            );
            if (label.target.isHidden() || label.isHidden()) {
                classes = classes.concat(
                    helper.getStateClasses(label, 'hidden'),
                    helper.getPartClasses(label.target, 'validity-hidden')
                );
            }
            return classes;
        }

        Validity.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            {
                name: 'validity',
                paint: function (label, validity) {
                    var validState = validity && validity.getValidState();
                    var classes = getClasses(label, validState);
                    label.main.className = classes.join(' ');

                    label.disposeChildren();
                    if (validity) {
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
                        label.main.innerHTML = message || '';
                        label.initChildren();
                    }
                    else {
                        label.main.innerHTML = '';
                    }
                }
            }
        );

        Validity.prototype.dispose = function () {
            if (helper.isInStage(this, 'DISPOSED')) {
                return;
            }
            
            if (this.target) {
                this.target.validityLabel = null;
                this.target = null;
            }
            this.focusTarget = null;

            if (this.main.parentNode) {
                this.main.parentNode.removeChild(this.main);
            }

            Control.prototype.dispose.apply(this, arguments);
        };

        // 这个控件是不能从`main.init()`生成的，只能通过`InputControl`直接构建出来，
        // 所以不在`main`下注册
        lib.inherits(Validity, Control);
        return Validity;
    }
);