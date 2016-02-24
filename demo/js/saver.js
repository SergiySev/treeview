;(function (window) {
    'use strict';

    function storageSupport() {
        var item = 'storageSupport';
        try {
            localStorage.setItem(item, item);
            localStorage.removeItem(item);
            return true;
        } catch(e) {
            return false;
        }
    }
    if( !storageSupport() ) {
        alert('Local Storage isn\'t supported :(');
    }

    var key = 'treeview.';

    Storage.saveData = function(id, jsonData) {
        localStorage.setItem(key + id.toString(), JSON.stringify(jsonData));
    };
    Storage.readData = function(id) {
        var data = JSON.parse(localStorage.getItem(key + id.toString()));
        return data;
    };

    window.Storage = Storage;
})(window);