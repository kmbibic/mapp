class  Visitor {
    visitSimplifiedNode(simplifyNode) {
        simplifyNode.next()
    }

    visitStepsNode(stepsNode) {
        stepsNode.next()
    }

    visitUnauthorizeNode(lockedNode) {
        lockedNode.next()
    }
}

module.exports = Visitor