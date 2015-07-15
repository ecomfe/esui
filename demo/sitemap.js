
function genNavigator() {
    var navItems =
        '<li><a href="BoxGroup.html">BoxGroup</a></li>' +
        '<li><a href="Button.html">Button</a></li>' +
        '<li><a href="Calendar.html">Calendar</a></li>' +
        '<li><a href="Checkbox.html">Checkbox</a></li>' +
        '<li><a href="commandMenu.html">Command Menu</a></li>' +
        '<li><a href="Crumb.html">Crumb</a></li>' +
        '<li><a href="Dialog.html">Dialog</a></li>' +
        '<li><a href="Form.html">Form</a></li>' +
        '<li><a href="Label.html">Label</a></li>' +
        '<li><a href="Link.html">Link</a></li>' +
        '<li><a href="MonthView.html">Month View</a></li>' +
        '<li><a href="Pager.html">Pager</a></li>' +
        '<li><a href="Panel.html">Panel</a></li>' +
        '<li><a href="RangeCalendar.html">Range Calendar</a></li>' +
        '<li><a href="RichCalendar.html">Rich Calendar</a></li>' +
        '<li><a href="Region.html">Region</a></li>' +
        '<li><a href="Schedule.html">Schedule</a></li>' +
        '<li><a href="Select.html">Select</a></li>' +
        //'<li><a href="Sidebar.html">Sidebar</a></li>' +
        '<li><a href="SearchBox.html">SearchBox</a></li>' +
        '<li><a href="Tab.html">Tab</a></li>' +
        '<li><a href="Table.html">Table</a></li>' +
        '<li><a href="TextBox.html">TextBox</a></li>' +
        '<li><a href="TextLine.html">TextLine</a></li>' +
        '<li><a href="Tip.html">Tip</a></li>' +
        '<li><a href="TipLayer.html">TipLayer</a></li>' +
        '<li><a href="Tree.html">Tree</a></li>' +
        '<li><a href="Toast.html">Toast</a></li>' +
        '<li><a href="ValidityLabel.html">Validity</a></li>' +
        '<li><a href="Wizard.html">Wizard</a></li>';
    var navigator = document.getElementById('navigator');
    navigator.innerHTML = navItems;
    var url = window.location.pathname;
    var filename = url.substring(url.lastIndexOf('/') + 1);
    var links = navigator.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('href') === filename) {
            var parent = links[i].parentNode;
            parent.setAttribute("class", "ui-sidebar-item-active"); 
        }
    }

    
}
genNavigator();

function footer() {
    var footHtml = '<p class="ui-text-center contrast">HI群：1401953</p>';
    var footerNode = document.createElement('div');
    footerNode.setAttribute("class", 'footer');
    footerNode.innerHTML = footHtml;
    document.getElementsByTagName('body')[0].appendChild(footerNode);
}
footer();
