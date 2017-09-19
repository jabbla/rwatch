NEKUI.install(Regular);

var config = {};

config.selectSource = {
    0: [
        {name: 'pc0', id: 0},
        {name: 'mobile0', id: 1},
        {name: 'lapTop0', id: 2}
    ],
    1: [
        {name: 'pc1', id: 0},
        {name: 'mobile1', id: 1},
        {name: 'lapTop1', id: 2}
    ],
    2: [
        {name: 'pc2', id: 0},
        {name: 'mobile2', id: 1},
        {name: 'lapTop2', id: 2}
    ]
};

var App = Regular.extend({
    template: document.getElementById('appTpl'),
    data: {
        title: 'Nav Table',
        tabState: {
            source: [{
                name: '类目1',
                key: 0
            }, {
                name: '类目2',
                key: 1
            }, {
                name: '类目3',
                key: 2
            }],
            selected: ''
        },
        selectState: {
            source: [],
            selected: ''
        },
        tableState: {
            source: [],
            columns: []
        }
    },
    config: function(data){
        var self = this;
        var watcher = rwatch(this);

        watcher.watch(['tabState.selected'], 'selectState.source', function(sources, target){
            var selectedKey = sources[0].value;
            return config.selectSource[selectedKey];
        });

        watcher.watch(['tabState.selected'], 'selectState.selected', function(sources, target){
            return 1;
        });
        
        watcher.watch(['tabState.selected', 'selectState.source'], 'tableState.columns', function(sources, target){
            var mainSelected = sources[0].value,
                selectSource = sources[1].value;

            return selectSource.map(function(item){
                return {name: item.name+mainSelected, key: item.name}
            });
        });
    },
    onSelect: function(e){
        var data = this.data;

        data.tabState.selected = e.key;
    }
});

new App().$inject('#app');

