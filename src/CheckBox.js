define(
    function (require) {
        var BoxControl = require('./BoxControl');
        require('css!./css/Radio.css');
        /**
         * 多选框控件
         * 
         * @param {Object} options 控件初始化参数
         */
        function CheckBox( options ) {
            BoxControl.call( this, options );
        }

        CheckBox.prototype.type = 'CheckBox';

        require('./lib').inherits( CheckBox, BoxControl );
        require('./main').register( CheckBox );
        return CheckBox;
    }
);