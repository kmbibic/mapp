function simplifyExpression(){
    hide("alert")
    let expression = document.getElementById("expression").value;

    $.ajax({
        type: 'POST',
        data: JSON.stringify({"expression": expression}),
        contentType: 'application/json',
        url: '/simplify',						
        success: function(data) {
            shownResponse(expression, data);
        },
        error: function(err) {
            showError(err.responseJSON.error);
        }
    })
}

function formatStringForOutput(message) {
    return message.replace(/\+/g," + ")
}

function shownResponse(input,output) {
    let response = document.getElementById("response")
    // Display response
    document.getElementById("output").innerHTML = formatStringForOutput(output)
    document.getElementById("input").innerHTML = formatStringForOutput(input)

    // Show response
    if (response.classList.contains("hidden")) {
        response.classList.remove("hidden")
    }
}

// These are user interface methods
function showError(message) {
    var errorMessage = document.getElementById("alert")
    errorMessage.querySelector("strong").innerHTML = message
    errorMessage.classList.remove("hidden");
    hide("response")
}

function hide(id){
    var element = document.getElementById(id)
    element.classList.add("hidden")
}