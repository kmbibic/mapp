function simplifyExpression(){
    hide("alert")
    hide("steps")
    let expression = document.getElementById("expression").value;
    let showSteps = document.getElementById("showSteps").checked;

    console.log(showSteps);

    $.ajax({
        type: 'POST',
        data: JSON.stringify({"expression": expression, "showSteps": showSteps}),
        contentType: 'application/json',
        url: '/simplify',						
        success: function(data) {
            console.log(data);
            shownResponse(expression, data.expression);

            if (showSteps) {
                shownSteps(expression, data.steps);
            }
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

function shownSteps(input,steps) {
    let stepOutput = "<tr><td>$STEP$</td></tr>"

    let stepsWell = document.getElementById("steps")
    let stepsBody = document.getElementById("stepsBody")

    stepsBody.innerHTML = ""

    var inputRow = stepOutput;
    inputRow = inputRow.replace(/\$STEP\$/,formatStringForOutput(input));
    stepsBody.innerHTML += inputRow;

    for (var i = 0; i < steps.length; i++) {
        let currentStep = steps[i];

        var tableRow = stepOutput 
        tableRow = tableRow.replace(/\$STEP\$/,formatStringForOutput(currentStep.step))

        stepsBody.innerHTML += tableRow
    }

    if (stepsWell.classList.contains("hidden")) {
        stepsWell.classList.remove("hidden")
    }
}

// These are user interface methods
function showError(message) {
    var errorMessage = document.getElementById("alert")
    errorMessage.querySelector("strong").innerHTML = message
    errorMessage.classList.remove("hidden");
    hide("response")
    hide("stepsWell")
}

function hide(id){
    var element = document.getElementById(id)
    element.classList.add("hidden")
}