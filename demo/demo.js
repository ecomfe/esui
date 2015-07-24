/** sample code
 * @file demo.js
 * @author fe
 */

define('demo',
    function (localRequire) {
        var $ = localRequire('jquery');
        function renderSample() {
            $('.example').each(function (index, item) {
                var $tab = $('<div data-ui-type="Tab" data-ui-id="democode' + index
                           + '"data-ui-variants="align-right-democode">'
                           + '<ul data-role="navigator" id="ctrl-default-democode'
                           + index + '-navigator" class="ui-tab-navigator"></ul></div>');
                var $tabHtml = $('<li data-for="democodehtml' + index + '"><span>HTML</span></li>');
                var $tabJs = $('<li data-for="democodejs' + index + '"><span>JS</span></li>');
                $tab.find('ul').append($tabHtml);
                var $tabContent = $('<div class="ui-tab-content ui-tab-content-democode-border"></div>');
                var $tabContentHtml = $('<div class="ui-tab-panel" id="democodehtml' + index + '"></div>');
                var $tabContentJs = $('<div class="ui-tab-panel" id="democodejs' + index + '"></div>');
                $tabContent.append($tabContentHtml);
                var $item = $(item);
                var $script = $item.next('script');
                if ($script.length > 0) {
                    $tab.find('ul').append($tabJs);
                    $tabContent.append($tabContentJs);
                }
                $tab.insertAfter($item);
                $tabContent.insertAfter($tab);

                var $sample = $('<div class="highlight"><pre class="source source-markup prettyprint">'
                    + '<code class="language-markup"></code></pre></div>');
                var $code = $sample.find('.language-markup');
                $item.nextAll('.ui-tab-content').find('#democodehtml' + index).html($sample);
                var sampleCode = $item.html();
                var indexOfFirstElement = sampleCode.indexOf('<');
                var arr = sampleCode.split('\n');
                var targetArr = [];
                var reg = new RegExp('^\\s{' + (indexOfFirstElement - 1) + '}');
                for (var i = 0; i < arr.length; i++) {
                    targetArr.push(arr[i].replace(reg, ''));
                }
                $code.text(targetArr.join('\n'));

                setTimeout(function () {
                    var refId = $script.data('refid');
                    if (refId) {
                        $script = $('#' + refId);
                    }
                    var jsText = $script.text();
                    var jsArray = jsText.split('\n');
                    var jsNewArray = [];
                    var jsIndex = 0;
                    for (var k = 0; k < jsText.length; k++) {
                        if ((/\s/).test(jsText[k])) {
                            jsIndex++;
                        }
                        else {
                            break;
                        }
                    }
                    var jsReg = new RegExp('^\\s{' + (jsIndex - 1) + '}');
                    for (var j = 0; j < jsArray.length; j++) {
                        jsNewArray.push(jsArray[j].replace(jsReg, ''));
                    }
                    var jsNewText = jsNewArray.join('\n');
                    var $jsSample = $('<div class="highlight"><pre class="source source-markup prettyprint">'
                        + '<code class="language-markup"></code></pre></div>');
                    $jsSample.find('.language-markup').text(jsNewText);
                    $item.nextAll('.ui-tab-content').find('#democodejs' + index).html($jsSample);
                    window.prettyPrint();
                }, 300);
            });
        }
        renderSample();
    }
);
