define(
    function (require) {
        var BoxControl = require('./BoxControl');
        /**
         * 多选框控件
         * 
         * @param {Object} options 控件初始化参数
         */
        function Radio( options ) {
            // 类型声明，用于生成控件子dom的id和class

            BoxControl.call( this, options );
        }

        Radio.prototype.type = 'Radio';

        require('./lib').inherits( Radio, BoxControl );
        require('./main').register( Radio );
        return Radio;
    }
);