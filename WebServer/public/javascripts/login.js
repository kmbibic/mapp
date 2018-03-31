function login(){
    let username = document.getElementById("inputUsername").value;
    let password = document.getElementById("inputPassword").value;

    $.ajax({
        type: 'POST',
        data: JSON.stringify({"username": username, "password": password}),
        contentType: 'application/json',
        url: '/login',
        success: function(data) {
            location.reload(true);
        }
    })
}