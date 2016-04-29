/**
 * 标签搜索控件
 * @file tplLoader.js
 * @author chuzhenyang(chuzhenyang@baidu.com)
 *         homfen
 */

define(
    function (require) {
        var $ = require('jquery');
        var tpl = require('./helper/template');

        return {
            load: function (resourceId, req, load) {
                $.get(req.toUrl(resourceId), function (data) {
                    tpl.compile(data);
                    load(data);
                });
            }
        };
    }
);

