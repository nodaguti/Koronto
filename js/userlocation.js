var UserLocation = {

    init: function(){
        this._node = document.getElementById('map-user-location');

        $('#user-address').on('blur keypress', function(e){
            if(e.type === 'keypress' && e.which !== 13) return;

            this.setLatLngFromAddress(e.target.value);
        }.bind(this));

        this.position = new Promise(function(resolve, reject){
            var nav = window.navigator;

            if(nav.geolocation){
                nav.geolocation.getCurrentPosition(
                    function(position){
                        resolve(position);
                    },

                    function(err){
                        console.error(err);
                        reject('No position available.');
                    },

                    {
                        enableHighAccuracy: true,
                        timeout: 5000
                    }
                )
            }else{
                reject('Geolocation is not supported.');
            }
        });


        this.position.then(
            function(position){
                var currentUserPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                this.populateMap(currentUserPos);
                this.populateAddress(currentUserPos);
            }.bind(this),

            function(err){
                toast('現在地の取得に失敗しました', 5000);
                console.log(err);
            }
        );
    },


    populateMap: function(latlng){
        $('#user-address').data('latitude', latlng.lat())
                          .data('longitude', latlng.lng());

        // 地図を作ります
        if(!this._map){
            this._map = new google.maps.Map(this._node, {
                zoom: 17,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });
        }else{
            this._map.setCenter(latlng);
        }


        // 現在地にマーカーを表示します.
        if(!this._marker){
            this._marker = new google.maps.Marker({
                position: latlng,
                map: this._map,
                title: '現在地'
            });
        }else{
            this._marker.setPosition(latlng);
        }
    },


    populateAddress: function(latlng){
        var geocoder = new google.maps.Geocoder();

        geocoder.geocode({
            location: latlng
        }, function(results, status){
            var addr = $('#user-address');

            addr.val('');

            if(status !== google.maps.GeocoderStatus.OK) return;
            if(!results[0].geometry) return;

            addr.val(results[0].formatted_address.replace(/^日本, /, ''));
        });
    },


    setLatLngFromAddress: function(addr){
        var geocoder = new google.maps.Geocoder();

        geocoder.geocode({
            address: addr
        }, function(results, status){
            if(status !== google.maps.GeocoderStatus.OK) return;
            if(!results[0].geometry) return;

            this.populateMap(results[0].geometry.location);
        }.bind(this));

    }

};
