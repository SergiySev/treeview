(function (window) {
    'use strict';

    var config = {
        openIcon: 'icon-folder-open', //expanded icon
        closeIcon: 'icon-folder', //collapsed icon
        collapsed: true, //default value
        label: 'name', //default value for text node in json object
        children: 'children' //default value for children's array in json object
    };

    var _mainElem; //DOMElement contains treeview
    var _treeChildren = {}; //Object with all collapsible nodes
    var _step = 0;

    var event;

    /*** Helpers Block ***/
    /**
     * removes all children elements
     * @param {DOMElement} node DOMElement to iterate over
     */
    function removeChildren(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    /**
     * string to boolean convertor
     * @param {string} val
     */
    function Bool(val) {
        return val === 'true';
    }

    /**
     * returns containing 'data-*' attribute values
     * @param {DOMElement} li
     */
    function getDataset(li) {
        var dataset = {};
        dataset.id = parseInt(li.getAttribute('data-id'));
        dataset.parentId = parseInt(li.getAttribute('data-parent-id'));
        dataset.children = parseInt(li.getAttribute('data-children'));
        dataset.collapsed = Bool(li.getAttribute('data-collapsed'));
        return dataset;
    }

    /*** End of Helpers Block ***/


    /*** Indentation and Icons Block ***/
    /**
     * returns span element matching the current level
     * @param {number} count Elements count
     */
    function addSpace(count) {
        var span;
        var spanList = [];
        var i;
        for (i = 0; i < count; i++) {
            span = document.createElement('span');
            span.classList.add('space');
            spanList.push(span.outerHTML);
        }
        return spanList.join('');
    }

    /**
     * returns label element
     * @param {string} labelText
     */
    function addLabel(labelText) {
        var label = document.createElement('label');
        label.innerText = labelText;
        return label;
    }

    /**
     * returns span element containing icon class
     * @param {boolean} closed If true - sets collapsed icon, else - expanded
     */
    function addIcon(closed) {
        var span = document.createElement('span');
        var iconClass = closed ? config.closeIcon : config.openIcon;
        span.classList.add(iconClass);
        return span;
    }

    /**
     * toggles icon from open to close and returns false if collapsed, false - expanded
     * @param {DOMElement} li
     */
    function changeIcon(li) {
        var childrenCount = parseInt(li.getAttribute('data-children'));
        if (childrenCount > 0) {
            var icon = li.childNodes[li.children.length - 2].classList;
            if (icon.contains(config.closeIcon)) {
                icon.remove(config.closeIcon);
                icon.add(config.openIcon);
                li.setAttribute('data-collapsed', false);
                return false;
            } else { /*if(icon.contains(config.openIcon))*/
                icon.remove(config.openIcon);
                icon.add(config.closeIcon);
                li.setAttribute('data-collapsed', true);
                return true;
            }
        }
        return false;
    }

    /*** End of Indentation and Icons Block ***/

    /*** Collapse Block ***/
    /**
     * collapses or expands selected leaf in the tree
     * @param {number} id
     * @param {boolean} isItemCollapsed
     * @param {boolean} isParentCollapsed
     */
    function collapse(id, isItemCollapsed, isParentCollapsed) {
        if (_treeChildren[id]) {
            _treeChildren[id].forEach(function (li) {
                if (!isItemCollapsed && !isParentCollapsed) {
                    li.classList.remove('hidden');
                } else {
                    li.classList.add('hidden');
                }

                var dataset = getDataset(li);

                if (dataset.children > 0) {
                    var _collapsed = dataset.collapsed;
                    if (!isItemCollapsed && isParentCollapsed && !_collapsed) {
                        _collapsed = true;
                    }

                    collapse(dataset.id, isItemCollapsed, _collapsed);
                }
            });
        }
    }

    /**
     * collapses or expands all node children of selected element
     * @param {DOMElement} node
     */
    function collapseAll(node) {
        var list = Array.prototype.slice.call(node.childNodes);
        list.forEach(function (li) {
            var dataset = getDataset(li);
            if (dataset.collapsed) {
                collapse(dataset.id, dataset.collapsed);
            }
        });
    }

    /*** End of Collapse Block ***/


    /**
     * renders the tree view
     * @param {array} arr JSON data
     * @param {DOMElement} node DOMElement container
     * @param {number} level Current indentation level
     * @param {number} parentId Parent Id
     */
    function render(arr, node, level, parentId) {
        level++;

        arr.forEach(function (item, index) {
            var li = document.createElement('li');
            li.setAttribute("data-id", _step);
            li.classList.add('noselect');
            //li.setAttribute("data-level", level);

            if (level > 1) {
                li.setAttribute("data-parent-id", parentId - 1);
                if (!_treeChildren[parentId - 1]) {
                    _treeChildren[parentId - 1] = [];
                }
                _treeChildren[parentId - 1].push(li);
            }

            _step++;
            node.appendChild(li);

            if (item.hasOwnProperty(config.children) && item[config.children].length > 0) {
                li.setAttribute("data-children", item[config.children].length);
                li.innerHTML = addSpace(level - 1);

                var collapsed = config.collapsed;
                if (item.hasOwnProperty('collapsed')) {
                    collapsed = item.collapsed;
                }

                li.setAttribute("data-collapsed", collapsed);
                li.appendChild(addIcon(collapsed));
                render(item[config.children], node, level, _step);

            } else {
                li.innerHTML = addSpace(level);
            }

            li.appendChild(addLabel(item[config.label]));
        });
    }


    /*** Events ***/
    /**
     * fires event
     * @param {string} type Event type
     * @param {object} data Custom argument contains selected elements information
     */
    function fireEvent(type, data) {
        event = document.createEvent('Event');
        event.initEvent(type, true, true);
        event.data = data;
        _mainElem.dispatchEvent(event);
    }


    function onClick(ev) {
        var li;
        if (ev.target.nodeName.toLowerCase() !== 'li') {
            li = ev.target.parentNode;
        } else {
            li = ev.target;
        }
        var state = changeIcon(li);
        var dataset = getDataset(li);

        fireEvent(TreeView.TREE_SELECT, dataset);

        if (!state && dataset.children > 0) {
            fireEvent(TreeView.TREE_COLLAPSE, dataset);
        } else if (state && dataset.children > 0) {
            fireEvent(TreeView.TREE_EXPAND, dataset);
        }

        collapse(dataset.id, state);
    }

    /*** End of Events ***/

    /*** JSON Generation ***/
    /**
     * converts treeview DOM to json data
     * @param {array} data JSON data container
     * @param {array} childNodes Children nodes
     * @param {boolean} isChild True if child node
     */
    function convertNodes2JSON(data, childNodes, isChild) {
        childNodes.forEach(function (li) {
            var dataset = getDataset(li);

            if ((!dataset.parentId) || isChild) {
                var obj = {
                    "name": li.getElementsByTagName('label')[0].innerText
                };

                if (dataset.collapsed) {
                    obj.collapsed = dataset.collapsed;
                }

                if (_treeChildren[dataset.id]) {
                    obj.children = convertNodes2JSON([], _treeChildren[dataset.id], true);
                }
                data.push(obj);
            }
        });

        return data;
    }

    /*** End of JSON Generation ***/


    function setData(data) {
        if (data) {
            _step = 0;
            _treeChildren = {};
            removeChildren(this.component);
            render(data, this.component, 0, _step);
            collapseAll(this.component);
        }
    }

    function getData() {
        var data = [];
        var childNodes = Array.prototype.slice.call(_mainElem.childNodes);

        return convertNodes2JSON(data, childNodes, false);
    }


    function addEvent(event, cb) {
        _mainElem.addEventListener(event, cb);
    }

    function removeEvent(event, cb) {
        _mainElem.addEventListener(event, cb);
    }


    /**
     * @constructor
     * @property {string} parent element id
     * @property {object} configuration properties
     */
    function TreeView(elemId, conf) {
        var holder = document.getElementById(elemId);
        holder.classList.add('treeview');
        _mainElem = document.createElement('ul');
        holder.appendChild(_mainElem);
        this.component = _mainElem;

        Object.keys(conf).forEach(function (key, index) {
            config[key] = conf[key];
        });

        holder.addEventListener('click', onClick);
    }


    TreeView.TREE_SELECT = 'TREE_SELECT';
    TreeView.TREE_EXPAND = 'TREE_EXPAND';
    TreeView.TREE_COLLAPSE = 'TREE_COLLAPSE';

    TreeView.prototype.addEvent = addEvent;
    TreeView.prototype.removeEvent = removeEvent;

    TreeView.prototype.setData = setData;
    TreeView.prototype.getData = getData;

    window.TreeView = TreeView;
})(window);


