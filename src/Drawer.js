/**
 * Drawer 实现
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file Drawer.js 抽屉控件
 * @class Drawer
 * @extends esui.ActionPanel
 * @author exodia(dengxinxin@baidu.com)
 *         yankun01(vcfg.code@hotmail.com)
 */
define(
    function (require) {
        var lib = require('./lib');
        var Control = require('./Control');

        function close(e) {
            e.preventDefault();

            var beforecloseEvent = this.fire('beforeclose');
            // 阻止事件，则不继续运行
            if (beforecloseEvent.isDefaultPrevented()) {
                return false;
            }

            this.hide();
            this.fire('close');
        }

        function parseMainElement(element) {
            var roles = {};
            var iterateChidlren = function (element, roles) {
                var roleName;
                var els = lib.getChildren(element);
                var len = els.length;
                while (len--) {
                    roleName = els[len].getAttribute('data-role');
                    if (roleName) {
                        roles[roleName] = els[len];
                    }
                }
            };

            iterateChidlren(element, roles);
            if (roles.header) {
                iterateChidlren(roles.header, roles);
            }
            return roles;
        }

        var exports = {};

        exports.type = 'Drawer';

        exports.initStructure = function () {
            var me = this;
            var main = me.main;

            me.$super(arguments);

            if (main.parentNode
                && main.parentNode.nodeName.toLowerCase() !== 'body') {
                document.body.appendChild(main);
            }
            var roles = parseMainElement(main);
            var tempEle;
            for (var key in roles) {
                if (roles.hasOwnProperty(key)) {
                    tempEle = roles[key];
                    tempEle.id = me.helper.getId(key);
                    me.helper.addPartClasses(key, tempEle);
                }
            }
        };

        exports.initEvents = function () {
            this.$super(arguments);
            var closeElement = this.helper.getPart('close');
            if (closeElement) {
                this.helper.addDOMEvent(closeElement, 'click', close);
            }
        };

        exports.show = function () {
            document.body.style.overflowY = 'hidden';
            lib.addClass(this.main, this.helper.getPrimaryClassName('visible'));
        };

        exports.hide = function () {
            document.body.style.overflowY = '';
            lib.removeClass(this.main, this.helper.getPrimaryClassName('visible'));
        };

        exports.dispose = function () {
            this.hide();
            lib.removeNode(this.main.id);
            this.$super(arguments);
        };

        var Drawer = require('eoo').create(Control, exports);
        require('./main').register(Drawer);

        return Drawer;
    }
);
