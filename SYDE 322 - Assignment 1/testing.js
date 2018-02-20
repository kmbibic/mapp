var test = (function() {
    var tests = [
        {
            input:"A+A",
            expectedOutput:"A",
        },{
            input:"A+0",
            expectedOutput:"A",
        },{
            input:"0+A",
            expectedOutput:"A",
        },{
            input:"A+1",
            expectedOutput:"1",
        },{
            input:"1+A",
            expectedOutput:"1",
        },{
            input:"A0",
            expectedOutput:"0",
        },{
            input:"A1",
            expectedOutput:"A",
        },{
            input:"(A+B)C",
            expectedOutput:"(A+B)C",
        },{
            input:"(A+A)+B",
            expectedOutput:"A+B",
        },{
            input:"~A~",
            expectedOutput:"Unable to compute this expression. Ensure the expression has valid operations.",
        },{
            input:"A++",
            expectedOutput:"Unable to compute this expression. Ensure the expression has valid operations.",
        },{
            input:"A+",
            expectedOutput:"Unable to compute this expression. Ensure the expression has valid operations.",
        },{
            input:")A+A(",
            expectedOutput:"Please ensure valid allignment of brackets.",
        },{
            input:"",
            expectedOutput:"Please enter an expression with at least 1 character",
        },{
            input:"$->$",
            expectedOutput:"Please enter an expression with valid characters. Only 0,1, letters, ~, +, ( and ) are allowed.",
        }
    ]
    
    var testOutput = "<tr><td>$INPUT$</td><td>$OUTPUT$</td><td>$EXPECTED_OUTPUT$</td><td>$SUCCESS$</td></tr>"
    
    var test = function() {
        for (var i = 0; i < tests.length; i++) {
            let currentTest = tests[i]
            console.log(currentTest)
            let output = MAPPServer.simplifyExpression(currentTest.input)  
    
            var testSuccess = false
    
            if ((output.error != null && currentTest.expectedOutput == output.error) || (output.expression == currentTest.expectedOutput)){
                testSuccess = true
            }
    
            var displayedOutput = output.success == true ? output.expression : output.error
    
            var tableRow = testOutput 
            tableRow = tableRow.replace(/\$INPUT\$/,currentTest.input)
            tableRow = tableRow.replace(/\$OUTPUT\$/,displayedOutput)
            tableRow = tableRow.replace(/\$EXPECTED_OUTPUT\$/,currentTest.expectedOutput)
            tableRow = tableRow.replace(/\$SUCCESS\$/,testSuccess)
    
            document.getElementById("tableBody").innerHTML += tableRow
        }
    
    }
    
    return {
        test: function() {
            test()
        }
    }
})()




