NEKUI.install(Regular);
rwatch.install(Regular);

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
        var watcher = this.rwatch();

        watcher.watch('tabState.selected', ['selectState.selected', 'selectState.source'], [function(source, target){
            return 1;
        }, function(source, target){
            var selectedKey = source;
            return config.selectSource[selectedKey];
        }]).then(function(targets, source){
            console.log(targets);
        });

        watcher.watch('tabState.selected', ['test1', 'test2'], [function(source, target){
            return source;
        }, function(source, target){
            return source;
        }]);

        watcher.watch('tabState.selected', 'title', function(source, target, callback){
            return source;
        }).then(function(target, source){
            console.log(source);
            //alert(target);
        });
        
        watcher.watch(['tabState.selected', 'selectState.source'], 'tableState.columns', function(sources, target){
            var mainSelected = sources[0],
                selectSource = sources[1];
            
            return selectSource.map(function(item){
                return {name: item.name+mainSelected, key: item.name}
            });
        }).then(function(target, source){
            console.log(source);
        });
    },
    onSelect: function(e){
        var data = this.data;
        data.tabState.selected = e.key;
    }
});

new App().$inject('#app');

