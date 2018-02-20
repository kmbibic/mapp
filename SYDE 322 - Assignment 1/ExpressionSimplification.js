var ExpressionSimplification = ( function() {
    //Subsystems
    var simplificationHandler = (function() {
        var simplifyExpression = function(expression) {
            return simplificationEvaluator.evaluateSimplification(expression)
        }
        
        return {
            simplifyExpression: function(expression) {
                return simplifyExpression(expression)
            } 
        }
    })()

    var simplificationEvaluator = (function() {
        // 1. Find inner most bracket set
        // 2. Simplify bracket set if possible
        // 3. If not possible, try next larger expression 
        var simplificationRules = [
            {
                name: "0 AND A",
                regex: /[^\+]*(?<!(?:\$\!))(0)(?!(?:\$\!))[^\+]*/,
                replacement: '$1'
            },{
                name: "A AND 1 (A1)",
                regex: /([^\+]+)(?<!(?:\$\!))1(?!(?:\$\!))([^\+]*)/,
                replacement: '$1$2'
            },{
                name: "1 AND A (1A)",
                regex: /([^\+]*)(?<!(?:\$\!))1(?!(?:\$\!))([^\+]+)/,
                replacement: '$1$2'
            },{
                name: "A OR 1",
                regex: /.*\+(1)/,
                replacement:'$1'
            },{
                name: "1 OR A",
                regex: /(1)\+.*/,
                replacement:'$1'
            },{
                name: "A OR 0",
                regex: /(.*)\+0/,
                replacement:'$1'
            },{
                name: "0 OR A",
                regex: /0\+(.*)/,
                replacement:'$1'
            },{
                name: "A OR A",
                regex: /((?<=\+|^)([A-Za-z0-1~]+)\+(\2)(?=\+|$))/,
                replacement:'$2'
            },
        ]

        var simplifyWithOneRule = function(expression, regex, replacement) {
            var simplifiedExpression = expression.replace(regex,replacement)
            
            if (expression == simplifiedExpression) {
                return simplifiedExpression
            }

            return simplifyWithOneRule(simplifiedExpression, regex, replacement)
        }

        var simplifyAllRules = function(expression) {
            var currentExpression = expression

            for (i in simplificationRules) {
                let rule = simplificationRules[i]
                currentExpression = simplifyWithOneRule(currentExpression, rule.regex, rule.replacement)
                console.log(currentExpression + " using " + rule.name)
            }

            if (currentExpression == expression) {
                return currentExpression
            }
            
            return simplifyAllRules(currentExpression)
        }

        var simplifyParentheses = function(expression) {
            var stack = Array()

            var currentExpression = expression
            var index = 0

            var keyLookup = []
            var keyLookupIndex = 0

            while (index < currentExpression.length) {
                let currentChar = currentExpression[index]
                if (currentChar == '(') {
                    stack.push(index)
                } else if (currentChar == ')') {

                    let openingBracket = stack.pop()
                    var substring = currentExpression.substring(openingBracket+1,index)

                    substring = simplifyAllRules(substring) 

                    if (/\+/.test(substring)) {
                        keyLookup[keyLookupIndex] = substring
                        substring = "$!" + (keyLookupIndex) + "!$"
                        keyLookupIndex++
                    }
                    
                    let newExpression = currentExpression.slice(0,openingBracket) + substring + currentExpression.slice(index+1,currentExpression.length)
                    currentExpression = newExpression
                    
                    index = openingBracket + substring.length -1 
                }
                index++
            }

            // simplify total after simplifying all brackets
            currentExpression = simplifyAllRules(currentExpression)

            // replace all substrings that still have parentheses
            for (var i = 0; i < keyLookup.length; i++) {
                let regexLookup = new RegExp("\\$\\!"+i+"\\!\\$")
                currentExpression = currentExpression.replace(regexLookup,"("+keyLookup[i]+")")
            }

            return currentExpression
        }

        var evaluateSimplification = function(expression) {
            return simplifyParentheses(expression)
        }
        
        return {
            evaluateSimplification: function(expression) {
                return evaluateSimplification(expression)
            } 
        }
    })()
    
    var simplifyExpression = function(expression) {
        return simplificationHandler.simplifyExpression(expression)
    }
    
    return {
        simplifyExpression: function(expression) {
            return simplifyExpression(expression)
        }
    }
})()