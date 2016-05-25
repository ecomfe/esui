/**
 * 模版加载引擎
 * @file tplLoader.js
 * @author yankun(yankun01@baidu.com)
 */

define(
    function (require) {
        var $ = require('jquery');
        var engine = require('./templateEngine').get();



        return {
            load: function (resourceId, req, load) {
                function processTemplate(data) {
                    engine.compile(data);
                    load(data);
                }
                if (resourceId.indexOf('.tpl.html') >= 0) {
                    $.get(req.toUrl(resourceId), processTemplate);
                }
                else {
                    req([resourceId], processTemplate);
                }
            }
        };
    }
);
