//setup ajax error handling
$.ajaxSetup({
    error: function (error, status, errorCodeMessage) {
        if (!error || !error.responseJSON) {
            return
        }

        if (error.responseJSON.redirect && error.responseJSON.redirectURL) {
            window.location.replace(error.responseJSON.redirectURL)
        }
        else if(error.responseJSON.error){
            showErrorMessage(error.responseJSON.error)
        }
    }
});