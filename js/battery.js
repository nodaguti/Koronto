var Battery = {

    // 歩く分速
    WALK_SPEED: 40,

    init: function(){
        this.manager = new Promise(function(resolve, reject){
            var nav = window.navigator;

            if(nav.battery){
                resolve(nav.battery);
            }else if(nav.mozBattery){
                resolve(nav.mozBattery);
            }else if(nav.getBattery instanceof Function){
                nav.getBattery().then(function(battery){
                    resolve(battery);
                });
            }else{
                reject('Battery Status API is not supported.');
            }
        });

        this.manager.then(
            function(battery){
                this._level = battery.level * 100;
                this._dischargingTime = battery.dischargingTime / 60 | 0;

                this._batteryStatusChanged();
            }.bind(this),

            function(err){
                toast('バッテリー情報の取得に失敗しました', 5000);
                console.error(err);

                this._level = undefined;
                this._dischargingTime = undefined;

                this._batteryStatusChanged();
            }.bind(this)
        );

        $('#charge-level, #discharging-time, #search-area').on('change', function(event){
            this._level = $('#charge-level').val() - 0 || 0;
            this._dischargingTime = $('#discharging-time').val() - 0 || 0;

            if(event.target.id === 'search-area'){
                this._dischargingTime = (event.target.value - 0) / this.WALK_SPEED | 0;
            }

            this._batteryStatusChanged(event.target.id);
        }.bind(this));
    },


    get _area(){
        return this._dischargingTime * this.WALK_SPEED || 500;
    },


    _batteryStatusChanged: function(){
        $('#charge-level').val(this._level);
        $('#discharging-time').val(this._dischargingTime);
        $('#search-area').val(this._area);
    }

};
