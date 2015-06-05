/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 键盘事件
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {

        var $ = require('jquery');
        var u = require('underscore');

        var specialKeys = {
            8: 'backspace',
            9: 'tab',
            // 10: 'return',
            13: 'return',
            16: 'shift',
            17: 'ctrl',
            18: 'alt',
            19: 'pause',
            20: 'capslock',
            27: 'esc',
            32: 'space',
            33: 'pageup',
            34: 'pagedown',
            35: 'end',
            36: 'home',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            45: 'insert',
            46: 'del',
            59: ';',
            61: '=',
            96: '0',
            97: '1',
            98: '2',
            99: '3',
            100: '4',
            101: '5',
            102: '6',
            103: '7',
            104: '8',
            105: '9',
            106: '*',
            107: '+',
            109: '-',
            110: '.',
            111: '/',
            112: 'f1',
            113: 'f2',
            114: 'f3',
            115: 'f4',
            116: 'f5',
            117: 'f6',
            118: 'f7',
            119: 'f8',
            120: 'f9',
            121: 'f10',
            122: 'f11',
            123: 'f12',
            144: 'numlock',
            145: 'scroll',
            173: '-',
            186: ';',
            187: '=',
            188: ',',
            189: '-',
            190: '.',
            191: '/',
            192: '`',
            219: '[',
            220: '\\',
            221: ']',
            222: '\''
        };

        var shiftNums = {
            '`': '~',
            '1': '!',
            '2': '@',
            '3': '#',
            '4': '$',
            '5': '%',
            '6': '^',
            '7': '&',
            '8': '*',
            '9': '(',
            '0': ')',
            '-': '_',
            '=': '+',
            ';': ': ',
            '\'': '"',
            ',': '<',
            '.': '>',
            '/': '?',
            '\\': '|'
        };

        // excludes: button, checkbox, file, hidden, image, password, radio, reset, search, submit, url
        var textAcceptingInputTypes = [
            'text', 'password', 'number', 'email', 'url', 'range', 'date', 'month', 'week', 'time', 'datetime',
            'datetime-local', 'search', 'color', 'tel'];

        // default input types not to bind to unless bound directly
        var textInputTypes = /textarea|input|select/i;
        // 对input元素不响应keyboard事件
        var filterInputAcceptingElements = true;
        // 对input type进行过滤
        var filterTextInputs = true;
        // 如果元素可编辑，则不响应keyboard
        var filterContentEditable = true;

        function keyHandler(handleObj) {

            // Only care when a possible input has been specified
            if (!handleObj.data || !handleObj.data.keys || typeof handleObj.data.keys !== 'string') {
                return;
            }

            var origHandler = handleObj.handler;
            var keys = handleObj.data.keys.toLowerCase().split(' ');

            handleObj.handler = function (event) {
                // 对输入类控件默认不出发，除非直接绑定在该控件上
                if (this !== event.target &&
                    (filterInputAcceptingElements && textInputTypes.test(event.target.nodeName)
                        || (filterContentEditable && $(event.target).attr('contenteditable'))
                        || (filterTextInputs && $.inArray(event.target.type, textAcceptingInputTypes) > -1)
                    )
                ) {
                    return;
                }

                var special = event.type !== 'keypress' && specialKeys[event.which];
                var character = String.fromCharCode(event.which).toLowerCase();
                var modif = '';
                var possible = {};

                u.each(
                    ['alt', 'ctrl', 'shift'],
                    function (specialKey) {
                        if (event[specialKey + 'Key'] && special !== specialKey) {
                            modif += specialKey + '+';
                        }
                    }
                );

                // metaKey is triggered off ctrlKey erronously
                if (event.metaKey && !event.ctrlKey && special !== 'meta') {
                    modif += 'meta+';
                }

                if (event.metaKey && special !== 'meta' && modif.indexOf('alt+ctrl+shift+') > -1) {
                    modif = modif.replace('alt+ctrl+shift+', 'hyper+');
                }

                if (special) {
                    possible[modif + special] = true;
                }
                else {
                    possible[modif + character] = true;
                    possible[modif + shiftNums[character]] = true;

                    // '$' can be triggered as 'Shift+4' or 'Shift+$' or just '$'
                    if (modif === 'shift+') {
                        possible[shiftNums[character]] = true;
                    }
                }

                for (var i = 0, l = keys.length; i < l; i++) {
                    if (possible[keys[i]]) {
                        return origHandler.apply(this, arguments);
                    }
                }
            };
        }

        u.each(
            ['keydown', 'keyup', 'keypress'],
            function (eventName) {
                $.event.special[eventName] = {
                    add: keyHandler
                };
            }
        );

        var filterInputAcceptingElements = true;
        // 对input type进行过滤
        var filterTextInputs = true;
        // 如果元素可编辑，则不响应keyboard
        var filterContentEditable = true;

        var exports = {

            setFilterInputAcceptingElements: function (bool) {
                filterInputAcceptingElements = bool;
            },

            setFilterTextInputs: function (bool) {
                filterTextInputs = bool;
            },

            setFilterContentEditable: function (bool) {
                filterContentEditable = bool;
            }
        };

        // 输出keycode按键名称常量，如UP,ESC等
        // 使用如：e.keyCode === keyboard.UP
        u.each(
            specialKeys,
            function (item, key) {
                exports[item.toUpperCase()] = parseInt(key, 10);
            }
        );

        return exports;
    }
);
