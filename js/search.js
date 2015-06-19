var Search = {

    init: function(){
        $('#results').hide();
        $('#btn-search').on('click', this.search.bind(this));
        $('#facilities').on('click', 'li', this._populateFacility.bind(this));
    },


    search: function(e){
        var results = $('#results');

        e.preventDefault();

        var address = $('#user-address');
        var lng = address.data('longitude') - 0;
        var lat = address.data('latitude') - 0;
        var range = $('#search-area').val() - 0;

        if(!range || !lng || !lat){
            toast('移動可能範囲と現在地を指定してください', 3000);
            return;
        }

        // 結果画面を表示してスクロール
        $('#facilities').hide().empty();
        $('#search-status').empty();
        results.show();
        $('body, html').animate({ scrollTop: results.offset().top }, 300, 'swing');

        // 検索して結果を表示
        this.fetchNearOasesList(lng, lat, range).then(
            function(facilities){
                this._populateFacilities(facilities);
            }.bind(this),

            function(err){
                toast('検索に失敗しました', 3000);
                console.error(err);
            }
        );

        return false;
    },


    fetchNearOasesList: function(longitude, latitude, range){
        var defer = $.Deferred();

        var range_lo = range / 111323.6;  //rangeを経度に換算
        var range_la = range / 111135.0;  //rangeを緯度に換算
        //経度:1度=111323.6[m]
        //緯度:1度=111135[m]

        var oasis_url = 'http://oasis.mogya.com/api/v0/search?n=' + parseFloat(latitude + range_la)
                            + '&s=' + parseFloat(latitude - range_la)
                            + '&w=' + parseFloat(longitude - range_lo)
                            + '&e=' + parseFloat(longitude + range_lo)
                            + '&lat=' + parseFloat(latitude)
                            + '&lng=' + parseFloat(longitude);


        //モバイラーズオアシス API に Ajax を用いてアクセスする
        //今回は jQuery を利用するのでちょっと簡単に書けます
        //詳しくは http://semooh.jp/jquery/api/ajax/jQuery.ajax/options/

        $.ajax({
            type: 'GET',
            url:oasis_url ,
            dataType: 'json',
            cache: false
        }).success(function(data){
            if(!data.results) return defer.reject('Unknown Error.');

            //成功した時
            // http://oasis.mogya.com/blog/API の「例」に書いてあるようなオブジェクトが data に入っています.
            //
            // 「オブジェクト」とは C でいうところの構造体, Java でのインスタンスみたいなものだと思って下さい.
            // {} でくくってある部分は「オブジェクト」, [] でくくってある部分は配列です.
            // var obj = { a: "first", b: "second", c: 'third' } というオブジェクトがあったとすると,
            // obj.a とすることで a にアクセスできます.
            // つまり, obj.a の値は "first" (first という文字列) です.
            //
            // 今回で言えば, data.results とすると 結果の配列が得られることになります.
            // つまり, 上記ページの「例」では data.results[0].entry_id とすると 28188 が得られます.
            //
            // また, 配列に対してどんな操作ができるかは
            //    Array - JavaScript | MDN
            //    https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array
            // を参照して下さい.
            // 要素の追加, ソートなどいろいろなメソッドがあります.

            /*for(var i=0;i<5;i++){
                alert(data.results[i].distance);
            }*/
            //オブジェクトの中身の表示が面倒だったのでこれで確認しましたが多分ソートされてます大丈夫です

            // 取得したい範囲にある施設のオブジェクトを入れておく配列
            var oasesWithinRange = [];

            // data.results を, 距離順(近い順)でソートします
            /*data.results.sort(
                function(a,b){
                    var aName = a.distance;
                    var bName = b.distance;
                    if( a < b ) return 1;
                    if( a > b ) return -1;
                    return 0;
                }
            );*/
            // data.results を先頭から見ていって,
            // 距離が range より小さければ oasesWithinRange に追加します.
            // 途中で range より大きい distance を持つ施設のオブジェクトが出てきたら,
            // そこでループを終了します.
            // なぜなら, すでに data.results は距離順でソートされているから,
            // これ以上調べてもより遠い施設しか出てこないからです.
            for(var i=0; i<data.results.length; i++){
                if( (data.results[i].distance)*1000<range){
                    oasesWithinRange.push(data.results[i]);
                }
            }

            //console.log(data);
            //console.log(oasesWithinRange);

            // 結果を返します.
            defer.resolve(oasesWithinRange);

        }).error(function(err){
            //失敗した時
            defer.reject(err);
        });

        return defer.promise();
    },


    _populateFacilities: function(facilities){
        var node = $('#facilities');

        node.empty();

        if(facilities.length < 1){
            node.text('No facilities found.');
            $('#search-status').text('No facilities found.');
            return;
        }else{
            node.show();
            $('#search-status').text(facilities.length + ' results.');
        }

        facilities.forEach(function(facility){
            var icon;

            if(~facility.category.indexOf('バー')) icon = 'mdi-maps-local-bar';
            else if(~facility.category.indexOf('喫茶店')) icon = 'mdi-maps-local-cafe';
            else if(~facility.category.indexOf('ファストフード')) icon = 'mdi-maps-local-restaurant';
            else if(~facility.category.indexOf('飲食店')) icon = 'mdi-maps-local-restaurant';
            else if(~facility.category.indexOf('図書館')) icon = 'mdi-maps-local-library';
            else if(~facility.category.indexOf('ネットカフェ')) icon = 'mdi-hardware-computer';
            else if(~facility.category.indexOf('コンビニエンスストア')) icon = 'mdi-maps-local-convenience-store';
            else if(~facility.category.indexOf('コワーキングスペース')) icon = 'mdi-action-work';
            else {
                icon = 'mdi-maps-place';
                console.log(facility.title, facility.category);
            }

            // 距離と所要時間を小数第1位まで計算する
            var distance = (facility.distance * 1000 * 10 | 0) / 10;
            var time = ((distance / 64) * 10 | 0) / 10;

            var item = $('<li>' +
                  '<div class="collapsible-header">' +
                      '<i class="' + icon + '"></i>' + facility.title +
                      '<span class="right-align hide-on-small-only">' + time + ' 分 (' + distance + ' m)</span>' +
                  '</div>' +
                  '<div class="collapsible-body"><div class="row"><div class="col s10 offset-s1 facility-info"></div></div></div>' +
            '</li>');

            $(item[0]).data('title', facility.title)
                      .data('address', facility.address)
                      .data('lng', facility.longitude)
                      .data('lat', facility.latitude)
                      .data('url', facility.url_pc)
                      .data('api_url', facility.mo_url)
                      .data('tel', facility.tel)
                      .data('category', facility.category[0])
                      .data('distance', distance)
                      .data('time', time);

            item.appendTo(node);
        }, this);

        node.collapsible();
    },


    _populateFacility: function(e){
        var li = $(e.target).closest('li');
        var node = li.find('.facility-info');

        if(li.data('populated') === 'true') return;

        var info = {};

        [
            'title',
            'address',
            'tel',
            'url',
            'api_url',
            'lat',
            'lng',
            'category',
            'distance',
            'time',
        ].forEach(function(item){
            info[item] = li.data(item) || '情報なし';
        });


        var list = $(
            '<ul class="collection">' +
                '<li class="collection-item">' +
                    '<i class="mdi-action-schedule" title="所要時間"></i> ' +
                    '徒歩約' + info.time + '分 (' + info.distance + ' m)' +
                '</li>' +
                '<li class="collection-item">' +
                    '<i class="mdi-maps-layers" title="店名"></i> ' +
                    info.title + ' (' + info.category + ')' +
                '</li>' +
                '<li class="collection-item">' +
                    '<i class="mdi-communication-location-on" title="住所"></i> ' +
                    info.address +
                '</li>' +
                '<li class="collection-item">' +
                    '<i class="mdi-communication-call" title="電話番号"></i> ' +
                    '<a href="tel:' + info.tel + '">' + info.tel + '</a>' +
                '</li>' +
                '<li class="collection-item">' +
                    '<i class="mdi-hardware-cast-connected"></i> ' +
                    '<a href="' + info.url + '" target="_blank">公式サイト</a>' +
                '</li>' +
                '<ul class="collection-item">' +
                    '<i class="mdi-action-exit-to-app"></i>' +
                    '<a href="' + info.api_url + '" target="_blank">電源についての詳細 (モバイラーズオアシス)</a>' +
                '</li>' +
            '</ul>'
        ).appendTo(node);

        var mapNode = $('<div class="map-facility"></div>').appendTo(node);

        var facilityPos = new google.maps.LatLng(info.lat - 0, info.lng - 0);

        var map = new google.maps.Map(mapNode[0], {
            zoom: 17,
            center: facilityPos,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        var marker = new google.maps.Marker({
            position: facilityPos,
            map: map,
            title: info.title
        });

        li.data('populated', 'true');
    }

};
