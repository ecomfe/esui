/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Label控件
 * @author erik
 */

define(
    function (require) {
        var Control = require('./Control');
        function Label(options) {
            Control.call(this, options);
        }

        Label.prototype.type = 'Label';

        require('./lib').inherits(Label, Control);
        require('./main').register(Label);
        return Label;
    }
);
