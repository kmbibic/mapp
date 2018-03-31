function hide(id){
    var element = document.getElementById(id)

    if (element == null) {
        return;
    }
    
    element.classList.add("hidden")
}

function showErrorMessage(message) {
    var errorMessage = document.getElementById("alert")
    errorMessage.querySelector("strong").innerHTML = message
    errorMessage.classList.remove("hidden");
}