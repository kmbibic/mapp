function simplifyExpression(){
    hide("alert")
    hide("steps")

    var expression = document.getElementById("expression").value;
    let showSteps = document.getElementById("showSteps").checked;

    let validatorError = validator.validateExpression(expression)

    if (validatorError) {
        showErrorMessage(validatorError);
        return;
    }

    $.ajax({
        type: 'POST',
        data: JSON.stringify({"expression": expression, "showSteps": showSteps}),
        contentType: 'application/json',
        url: '/simplify',						
        success: function(data) {
            shownResponse(expression, data.expression);

            if (showSteps) {
                shownSteps(expression, data.steps);
            }
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
