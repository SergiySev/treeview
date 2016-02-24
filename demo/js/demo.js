var kode = document.getElementById('kode');

var treeView = new TreeView('tree', {
    openIcon: 'icon-folder-open',
    closeIcon: 'icon-folder',
    collapsed: false,
    label: 'name',
    children: 'children'
});

treeView.addEvent(TreeView.TREE_SELECT, function (e) {
    console.log('Select:', e.data);
});
treeView.addEvent(TreeView.TREE_EXPAND, function (e) {
    console.log('Expand:', e.data);
});
treeView.addEvent(TreeView.TREE_COLLAPSE, function (e) {
    console.log('Collapse:', e.data);
});


function readData() {
    var data = Storage.readData('tree');
    kode.value = JSON.stringify(data, null, 2);
    treeView.setData(data);
    return data;
}

function applyData() {
    var data = JSON.parse(kode.value);
    Storage.saveData('tree', data);
    treeView.setData(data);
    return data;
}

function saveData() {
    var data = treeView.getData();
    kode.value = JSON.stringify(data, null, 2);
    Storage.saveData('tree', data);
    return data;
}

function generateData() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data.json', false);
    xhr.send();
    if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        kode.value = JSON.stringify(data, null, 2);
        treeView.setData(data);
    }
}

window.onload = function (e) {
    if (readData() === '') {
        generateData();
    }
};