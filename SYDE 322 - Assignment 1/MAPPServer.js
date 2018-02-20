var MAPPServer = ( function() {
    var simplifyExpression = function(expression) {
        let parsedExpression = expression.replace(/\s/g, "")

        let validatorError = validator.validateExpression(parsedExpression)

        if (validatorError != null) {
            return {
                success: false,
                error: validatorError
            }
        }

        let simplifiedExpression = ExpressionSimplification.simplifyExpression(parsedExpression)

        return {
            success: true,
            expression: simplifiedExpression
        }
    }
    
    return {
        simplifyExpression: function(expression) {
           return simplifyExpression(expression) 
        }
    }
})()