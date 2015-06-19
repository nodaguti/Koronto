function init(){
    $(".button-collapse").sideNav();
    $('.modal-trigger').leanModal();

    Battery.init();
    UserLocation.init();
    Search.init();
}

$(document).ready(function(){
    init();
});
