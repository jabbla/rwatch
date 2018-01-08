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

        watcher.watch('params.periodType', [
            'comparePeriod.disabled',
            'chartParams.periodType',
            'chartTimeOptions'
        ], function(){});

        watcher.watch(['params.period', 'overviewParams.compareType'], 'overviewParams.comparePeriod', function(sources){
        });

        watcher.watch('params.period', [
            'comparePeriod.maxPeriod',
            'comparePeriod.fixPeriod'
        ], 
        function(){});

        watcher.watch('params.period', 'chartTimeOptions.selected', function(source, target){
        });

        watcher.watch('params.period', 'isSingleDay', function(source){
        });

        watcher.watch('isSingleDay', 'indicatorsSelector.source', function(source, target){
        });

        watcher.watch('params.period', 'comparePeriod.source', function(source, target){
        });

        watcher.watch('excludeVIPday', 'chartParams.excludeVIPday', function(source){
            return source;
        });

        watcher.watch('comparePeriod.selectedIndex', 'overviewParams.compareType', function(source){
        });

        watcher.watch('chartTimeOptions.selected', [
            'customTimer.show'
        ], function(){});

        watcher.watch('indicatorsSelector.currentChecked', 'overviewParams.dimArr', function(source){
            return source;
        });

        watcher.watch(['currentTab', 'keySummaryList'], 'chartParams.dim', function(sources, target){
        });
        watcher.displayRelationGraph();
    },
    onSelect: function(e){
        var data = this.data;
        data.tabState.selected = e.key;
    }
});

new App().$inject('#app');

